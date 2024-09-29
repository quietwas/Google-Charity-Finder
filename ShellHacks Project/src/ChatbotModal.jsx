import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Set App Element for Modal
Modal.setAppElement("#root");

function ChatbotModal({ isOpen, onRequestClose, charity }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chat, setChat] = useState(null);

  useEffect(() => {
    // Initialize GoogleGenerativeAI when the component mounts
    const initChat = async () => {
      try {
        const genAI = new GoogleGenerativeAI(process.env.REACT_APP_API_KEY); // Ensure this API key is set correctly
        const model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Log to ensure model is fetched successfully
        console.log("Model initialized", model);

        // Start chat and include charity information in the initial prompt
        const initialChat = model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: `Can you tell me about a charity named ${charity.name}?` }],
            },
            {
              role: "model",
              parts: [
                { text: `The nearest charity is ${charity.name}. Here is some information: ${charity.details}` },
              ],
            },
          ],
        });

        setChat(initialChat);
        setMessages([
          { sender: "bot", text: `The nearest charity is ${charity.name}. Here is some information: ${charity.details}` },
        ]);

        console.log("Chat initialized", initialChat);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      }
    };

    initChat();
  }, [charity]);

  const handleSendMessage = async () => {
    if (!input.trim()) return; // Don't send empty messages
    if (!chat) {
      console.error("Chat is not initialized");
      return;
    }

    const newMessage = { sender: "user", text: input };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    try {
      // Send the message to the chat
      const result = await chat.sendMessage(input);
      console.log("Message sent, response received", result);

      const botMessage = { sender: "bot", text: result.response.text() };
      setMessages((prevMessages) => [...prevMessages, newMessage, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const botMessage = { sender: "bot", text: "Sorry, something went wrong." };
      setMessages((prevMessages) => [...prevMessages, newMessage, botMessage]);
    }

    setInput(""); // Clear input after sending
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} className="modal">
      <h2>Chat about the nearest charity</h2>
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress} // Check for Enter key press
      />
      <button onClick={handleSendMessage}>Send</button>
    </Modal>
  );
}

export default ChatbotModal;
