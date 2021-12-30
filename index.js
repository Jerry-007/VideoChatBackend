const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());

const PORT = process.env.PORT || 8000;

const users = {};

const socketToRoom = {};

io.on("connection", (socket) => {
  console.log(socket.id);

  socket.on("joinedRoom", (roomId) => {
    if (users[roomId]) {
      users[roomId].push(socket.id);
    } else {
      users[roomId] = [socket.id];
    }

    socketToRoom[socket.id] = roomId;
    const usersInRoom = users[roomId].filter((id) => id !== socket.id);

    socket.emit("users", usersInRoom);
  });

  socket.on("sendingSignals", (data) => {
    io.to(data.userToSignal).emit("userJoined", {
      signal: data.signal,
      callerId: data.callerId,
    });
  });

  socket.on("returningSignal", (data) => {
    io.to(data.callerId).emit("receivedReturnedSignal", {
      signal: data.signal,
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }

    socket.broadcast.emit("user left", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Server Running");
});

server.listen(PORT, () => console.log(`Server Listening on PORT ${PORT}`));
