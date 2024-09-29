import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./App.css"

Modal.setAppElement("#root");

function ChatbotModal({ isOpen, onRequestClose, charityName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chat, setChat] = useState(null); // Store chat instance

  useEffect(() => {
    // Initialize chat instance when the modal opens and `charityName` is available
    const initChat = async () => {
      if (isOpen && charityName) {
        try {
          const genAI = new GoogleGenerativeAI(
            import.meta.env.VITE_GOOGLE_GENERATIVE_AI_KEY
          );
          const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
          });

          // Start the chat with context
          const chatInstance = model.startChat({
            history: [
              {
                role: "user",
                parts: [
                  {
                    text: `You are an assistant knowledgeable about charities. You will provide users with information about whichever charity/donation location
                    you are given. Do not refer to other sources for more information. If you have absolutely no information on the location,
                    then you can attempt to assume what they do by their name, while also refering to other sources for more information.
                    If you believe it is a local business, you can just say that it is likely a local business, and to try to visit their website or other
                    means of contacting them if interested in donating. Please assume based of the name what they potentially do instead of defaulting to other sources
                    of information.
                    Please provide information specifically about the charity named ${charityName}.`,
                  },
                ],
              },
            ],
          });

          setChat(chatInstance); // Save chat instance for later use

          // Display an initial message to the user
          const initialMessage = `What would you like to know about ${charityName}?`;
          setMessages([{ sender: "bot", text: initialMessage }]);
        } catch (error) {
          console.error("Failed to initialize chat:", error);
        }
      }
    };

    initChat();
  }, [isOpen, charityName]);

  const handleSendMessage = async () => {
    if (!input.trim() || !chat) return; // Ensure input and chat instance are valid

    const newMessage = { sender: "user", text: input };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    try {
      // Send the user's message to the chatbot
      const result = await chat.sendMessage(input);
      const botMessage = { sender: "bot", text: result.response.text() };

      // Append bot response to messages
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setInput(""); // Clear input after sending
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} className="modal">
      <div className="modal">
      <h2>Learn about {charityName}</h2>
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
    </Modal>
  );
}

export default ChatbotModal;
