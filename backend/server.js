const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

app.get('/api/test', (req, res) => {
    res.json({ message: 'Сервер работает!' });
});

app.post('/api/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.json({ success: false, message: 'Файл не загружен' });
    }
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
});

app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, MD5(?), ?)',
            [name, email, password, role]
        );
        res.json({ success: true, message: 'Регистрация успешна' });
    } catch (err) {
        res.json({ success: false, message: 'Ошибка: email уже существует' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await db.execute(
        'SELECT id, name, email, role FROM users WHERE email = ? AND password = MD5(?)',
        [email, password]
    );
    if (rows.length > 0) {
        res.json({ success: true, user: rows[0] });
    } else {
        res.json({ success: false, message: 'Неверные данные' });
    }
});

app.get('/api/my-quizzes/:userId', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM quizzes WHERE created_by = ? ORDER BY created_at DESC',
            [req.params.userId]
        );
        res.json(rows);
    } catch (err) {
        res.json([]);
    }
});

app.get('/api/available-quizzes', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT q.*, u.name as creator_name 
                FROM quizzes q 
                JOIN users u ON q.created_by = u.id 
                WHERE q.status = 'active' 
                ORDER BY q.created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        res.json([]);
    }
});

app.post('/api/create-quiz', async (req, res) => {
    const { title, category, time_per_question, created_by, room_code } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO quizzes (title, category, time_per_question, created_by, room_code, status) VALUES (?, ?, ?, ?, ?, "waiting")',
            [title, category || null, time_per_question || 30, created_by, room_code]
        );
        res.json({ success: true, quiz_id: result.insertId, room_code: room_code });
    } catch (err) {
        res.json({ success: false, message: 'Ошибка создания квиза' });
    }
});

app.delete('/api/delete-quiz/:quizId', async (req, res) => {
    const { quizId } = req.params;
    try {
        await db.execute('DELETE FROM questions WHERE quiz_id = ?', [quizId]);
        await db.execute('DELETE FROM quizzes WHERE id = ?', [quizId]);
        res.json({ success: true, message: 'Квиз удалён' });
    } catch (err) {
        res.json({ success: false, message: 'Ошибка удаления' });
    }
});

app.put('/api/reset-quiz-status/:roomCode', async (req, res) => {
    try {
        await db.execute('UPDATE quizzes SET status = "waiting" WHERE room_code = ?', [req.params.roomCode]);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false });
    }
});

app.post('/api/add-question', async (req, res) => {
    const { quiz_id, question_text, question_type, answer_type, options, correct_answer, points, order_num, image_url } = req.body;
    try {
        await db.execute(
            'INSERT INTO questions (quiz_id, question_text, question_type, answer_type, options, correct_answer, points, order_num, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [quiz_id, question_text, question_type, answer_type, options, correct_answer, points, order_num, image_url || null]
        );
        res.json({ success: true, message: 'Вопрос добавлен' });
    } catch (err) {
        res.json({ success: false, message: 'Ошибка добавления вопроса' });
    }
});

app.get('/api/quiz-questions/:quizId', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, question_text, question_type, answer_type, options, correct_answer, points, image_url, order_num FROM questions WHERE quiz_id = ? ORDER BY order_num',
            [req.params.quizId]
        );
        res.json(rows);
    } catch (err) {
        res.json([]);
    }
});

app.get('/api/quiz-info/:quizId', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT time_per_question FROM quizzes WHERE id = ?', [req.params.quizId]);
        res.json(rows[0] || { time_per_question: 30 });
    } catch (err) {
        res.json({ time_per_question: 30 });
    }
});

app.get('/api/my-history/:userId', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM results WHERE user_id = ? ORDER BY played_at DESC',
            [req.params.userId]
        );
        res.json(rows);
    } catch (err) {
        res.json([]);
    }
});

app.get('/api/my-organized/:userId', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT r.*, q.title as quiz_title,
                (SELECT COUNT(*) FROM results WHERE quiz_id = r.quiz_id AND played_at = r.played_at) as participants_count,
                (SELECT user_name FROM results WHERE quiz_id = r.quiz_id AND rank_position = 1 AND played_at = r.played_at LIMIT 1) as winner_name
                FROM results r 
                JOIN quizzes q ON r.quiz_id = q.id 
                WHERE q.created_by = ? 
                GROUP BY r.quiz_id, r.played_at 
                ORDER BY r.played_at DESC`,
            [req.params.userId]
        );
        res.json(rows);
    } catch (err) {
        res.json([]);
    }
});

const rooms = {};

io.on('connection', (socket) => {
    socket.on('host-room', async ({ roomCode, userId, quizId }) => {
        socket.join(roomCode);
        if (!rooms[roomCode]) {
            rooms[roomCode] = {
                hostId: userId,
                players: {},
                scores: {},
                currentQuestion: 0,
                questions: [],
                timePerQuestion: 30,
                quizId: quizId,
                quizTitle: null
            };
            await db.execute('UPDATE quizzes SET status = "active" WHERE room_code = ?', [roomCode]);
        }
    });

    socket.on('join-game', ({ roomCode, userId, userName }) => {
        if (!rooms[roomCode]) {
            socket.emit('error', 'Комната не найдена');
            return;
        }
        socket.join(roomCode);
        rooms[roomCode].players[userId] = { userId, name: userName, socketId: socket.id };
        rooms[roomCode].scores[userId] = rooms[roomCode].scores[userId] || 0;
        io.to(roomCode).emit('players-update', Object.values(rooms[roomCode].players));
    });

    socket.on('start-game', async ({ roomCode, questions, timePerQuestion, quizId, quizTitle }) => {
        if (!rooms[roomCode]) return;
        rooms[roomCode].questions = questions;
        rooms[roomCode].timePerQuestion = timePerQuestion || 30;
        rooms[roomCode].currentQuestion = 0;
        rooms[roomCode].quizId = quizId;
        rooms[roomCode].quizTitle = quizTitle;
        await db.execute('UPDATE quizzes SET status = "in_progress" WHERE room_code = ?', [roomCode]);
        io.to(roomCode).emit('game-started');
        setTimeout(() => {
            sendQuestion(roomCode, 0);
        }, 1000);
    });

    const sendQuestion = (roomCode, index) => {
        const room = rooms[roomCode];
        if (!room || index >= room.questions.length) return;

        const q = room.questions[index];
        const timeLimit = room.timePerQuestion || 30;
        room.currentStartTime = Date.now();
        room.currentTimeLeft = timeLimit;

        const questionData = {
            id: q.id,
            number: index + 1,
            total: room.questions.length,
            text: q.question_text,
            image: q.image_url,
            options: q.options.split('|'),
            answerType: q.answer_type,
            timeLimit: timeLimit
        };

        io.to(roomCode).emit('new-question', questionData);

        const timer = setInterval(() => {
            const roomNow = rooms[roomCode];
            if (!roomNow || roomNow.currentQuestion !== index) {
                clearInterval(timer);
                return;
            }
            const elapsed = Math.floor((Date.now() - roomNow.currentStartTime) / 1000);
            const left = Math.max(0, timeLimit - elapsed);
            roomNow.currentTimeLeft = left;
            io.to(roomCode).emit('timer-update', left);

            if (left <= 0) {
                clearInterval(timer);
                io.to(roomCode).emit('question-finished');
                setTimeout(() => {
                    if (rooms[roomCode] && rooms[roomCode].currentQuestion === index) {
                        nextQuestionAfterTimer(roomCode);
                    }
                }, 1500);
            }
        }, 1000);
    };

    const nextQuestionAfterTimer = (roomCode) => {
        const room = rooms[roomCode];
        if (!room) return;
        const nextIndex = room.currentQuestion + 1;
        if (nextIndex < room.questions.length) {
            room.currentQuestion = nextIndex;
            sendQuestion(roomCode, nextIndex);
        } else {
            endGame(roomCode);
        }
    };

    socket.on('submit-answer', ({ roomCode, userId, questionId, answer }) => {
        const room = rooms[roomCode];
        if (!room) return;

        const question = room.questions.find(q => q.id === questionId);
        if (!question) return;

        let pointsEarned = 0;

        if (question.answer_type === 'single') {
            if (answer === question.correct_answer) {
                pointsEarned = question.points;
            }
        } else {
            const userAnswers = Array.isArray(answer) ? answer : [answer];
            const correctAnswers = question.correct_answer.split('|');
            
            let correctSelected = 0;
            let wrongSelected = 0;
            
            for (let i = 0; i < userAnswers.length; i++) {
                if (correctAnswers.includes(userAnswers[i])) {
                    correctSelected++;
                } else {
                    wrongSelected++;
                }
            }
            
            if (correctSelected > 0 && wrongSelected === 0) {
                const pointsPerCorrect = question.points / correctAnswers.length;
                pointsEarned = Math.round(correctSelected * pointsPerCorrect);
            }
        }

        if (pointsEarned > 0) {
            room.scores[userId] = (room.scores[userId] || 0) + pointsEarned;
        }

        socket.emit('question-result', {
            correct: pointsEarned > 0,
            correctAnswer: question.correct_answer,
            pointsEarned
        });
    });

    const endGame = async (roomCode) => {
        const room = rooms[roomCode];
        if (!room) return;

        await db.execute('UPDATE quizzes SET status = "finished" WHERE room_code = ?', [roomCode]);

        const leaderboard = Object.entries(room.scores)
            .map(([userId, score]) => ({
                userId,
                name: room.players[userId]?.name || 'Участник',
                score
            }))
            .sort((a, b) => b.score - a.score);

        const maxScore = room.questions.reduce((sum, q) => sum + (q.points || 10), 0);
        const quizId = room.quizId;
        const quizTitle = room.quizTitle;

        if (quizId) {
            for (let i = 0; i < leaderboard.length; i++) {
                const player = leaderboard[i];
                try {
                    await db.execute(
                        `INSERT INTO results (quiz_id, quiz_title, user_id, user_name, score, max_score, rank_position, played_at) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                        [quizId, quizTitle, player.userId, player.name, player.score, maxScore, i + 1]
                    );
                } catch (err) {}
            }
        }

        io.to(roomCode).emit('leaderboard', leaderboard);

        setTimeout(() => {
            io.to(roomCode).emit('game-finished');
            delete rooms[roomCode];
        }, 5000);
    };

    socket.on('end-game', ({ roomCode }) => {
        endGame(roomCode);
    });

    socket.on('disconnect', () => {
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            let removed = false;
            for (const id in room.players) {
                if (room.players[id].socketId === socket.id) {
                    delete room.players[id];
                    delete room.scores[id];
                    removed = true;
                    break;
                }
            }
            if (removed) {
                io.to(roomCode).emit('players-update', Object.values(room.players));
            }
        }
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});