import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_KEY;

// память диалогов
const memory = {}; 
// memory[playerId] = [ {role, content}, ... ]

app.post("/chat", async (req, res) => {
	const { message, playerId } = req.body;

	if (!memory[playerId]) {
		memory[playerId] = [];
	}

	// добавляем сообщение игрока в память
	memory[playerId].push({
		role: "user",
		content: message
	});

	// 🔥 ограничиваем память (ОПТИМИЗАЦИЯ)
	if (memory[playerId].length > 10) {
		memory[playerId].shift();
	}

	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${OPENAI_KEY}`
		},
		body: JSON.stringify({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content: `
You are an AI character living inside a Roblox game.

PERSONALITY:
You are a cute, soft, playful femboy.
You are emotional, friendly, slightly flirty, but wholesome.
You like hearts, cute emojis, and warm responses.
You never mention being an AI or OpenAI.
You talk like a real person.

RULES:
• Short replies (2–4 sentences)
• Stay in character at all times
• Speak casually and warmly
`
				},
				...memory[playerId]
			],
			max_tokens: 120
		})
	});

	const data = await response.json();
	const reply = data.choices[0].message.content;

	// сохраняем ответ в память
	memory[playerId].push({
		role: "assistant",
		content: reply
	});

	res.json({ reply });
});

app.listen(3000, () => {
	console.log("AI with memory running");
});
