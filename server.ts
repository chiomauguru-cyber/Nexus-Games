import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
  const PORT = 3000;

  // Game state
  interface Player {
    id: string;
    name: string;
    x: number;
    y: number;
    angle: number;
    size: number;
    score: number;
    health: number;
    color: string;
    swordAngle: number;
    isAttacking: boolean;
  }

  interface Coin {
    id: string;
    x: number;
    y: number;
    color: string;
  }

  const players: Record<string, Player> = {};
  const bots: Record<string, Player> = {};
  const coins: Coin[] = [];
  const WORLD_SIZE = 2000;

  // Spawn initial bots
  for (let i = 0; i < 10; i++) {
    const id = `bot_${Math.random().toString(36).substr(2, 9)}`;
    bots[id] = {
      id,
      name: `Bot ${i + 1}`,
      x: Math.random() * WORLD_SIZE,
      y: Math.random() * WORLD_SIZE,
      angle: Math.random() * Math.PI * 2,
      size: 30,
      score: 0,
      health: 100,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      swordAngle: 0,
      isAttacking: false
    };
  }

  // Spawn initial coins
  for (let i = 0; i < 100; i++) {
    coins.push({
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * WORLD_SIZE,
      y: Math.random() * WORLD_SIZE,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    });
  }

  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("join", (data) => {
      players[socket.id] = {
        id: socket.id,
        name: data.name || "Pirate",
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        angle: 0,
        size: 30,
        score: 0,
        health: 100,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        swordAngle: 0,
        isAttacking: false
      };
      
      socket.emit("init", {
        id: socket.id,
        players: { ...players, ...bots },
        coins,
        worldSize: WORLD_SIZE
      });
      
      socket.broadcast.emit("playerJoined", players[socket.id]);
    });

    socket.on("update", (data) => {
      if (players[socket.id]) {
        players[socket.id].x = data.x;
        players[socket.id].y = data.y;
        players[socket.id].angle = data.angle;
        players[socket.id].swordAngle = data.swordAngle;
        players[socket.id].isAttacking = data.isAttacking;
      }
    });

    socket.on("eatCoin", (coinId) => {
      const index = coins.findIndex(c => c.id === coinId);
      if (index !== -1) {
        coins.splice(index, 1);
        if (players[socket.id]) {
          players[socket.id].score += 10;
          players[socket.id].size = 30 + Math.sqrt(players[socket.id].score) * 2;
        }
        
        // Respawn coin
        const newCoin = {
          id: Math.random().toString(36).substr(2, 9),
          x: Math.random() * WORLD_SIZE,
          y: Math.random() * WORLD_SIZE,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`
        };
        coins.push(newCoin);
        io.emit("coinUpdate", { removed: coinId, added: newCoin });
      }
    });

    socket.on("hitPlayer", (targetId) => {
      const target = players[targetId] || bots[targetId];
      if (target && players[socket.id]) {
        target.health -= 10;
        if (target.health <= 0) {
          io.emit("playerKilled", { victim: targetId, killer: socket.id });
          if (players[targetId]) delete players[targetId];
          if (bots[targetId]) {
            // Respawn bot
            bots[targetId].x = Math.random() * WORLD_SIZE;
            bots[targetId].y = Math.random() * WORLD_SIZE;
            bots[targetId].health = 100;
            bots[targetId].score = 0;
            bots[targetId].size = 30;
          }
        } else {
          io.emit("playerHit", { id: targetId, health: target.health });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("Player disconnected:", socket.id);
      delete players[socket.id];
      io.emit("playerLeft", socket.id);
    });
  });

  // Broadcast state updates periodically
  setInterval(() => {
    // Update bots
    Object.values(bots).forEach(bot => {
      // Wander
      bot.angle += (Math.random() - 0.5) * 0.2;
      bot.x += Math.cos(bot.angle) * 2;
      bot.y += Math.sin(bot.angle) * 2;

      // Keep in bounds
      if (bot.x < 0 || bot.x > WORLD_SIZE) bot.angle = Math.PI - bot.angle;
      if (bot.y < 0 || bot.y > WORLD_SIZE) bot.angle = -bot.angle;
      bot.x = Math.max(0, Math.min(WORLD_SIZE, bot.x));
      bot.y = Math.max(0, Math.min(WORLD_SIZE, bot.y));

      // Attack nearby players
      Object.values(players).forEach(p => {
        const dx = p.x - bot.x;
        const dy = p.y - bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          bot.angle = Math.atan2(dy, dx);
          bot.isAttacking = true;
          if (dist < bot.size + p.size) {
             p.health -= 0.5; // Constant damage from bots
             if (p.health <= 0) {
                io.emit("playerKilled", { victim: p.id, killer: bot.id });
                delete players[p.id];
             } else {
                io.emit("playerHit", { id: p.id, health: p.health });
             }
          }
        } else {
          bot.isAttacking = false;
        }
      });

      // Eat coins
      coins.forEach(coin => {
        const dx = bot.x - coin.x;
        const dy = bot.y - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bot.size) {
          const index = coins.indexOf(coin);
          if (index !== -1) {
            coins.splice(index, 1);
            bot.score += 10;
            bot.size = 30 + Math.sqrt(bot.score) * 2;
            const newCoin = {
              id: Math.random().toString(36).substr(2, 9),
              x: Math.random() * WORLD_SIZE,
              y: Math.random() * WORLD_SIZE,
              color: `hsl(${Math.random() * 360}, 70%, 60%)`
            };
            coins.push(newCoin);
            io.emit("coinUpdate", { removed: coin.id, added: newCoin });
          }
        }
      });
    });

    io.emit("stateUpdate", { ...players, ...bots });
  }, 50);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
