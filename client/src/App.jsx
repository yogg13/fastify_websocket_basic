import { useEffect, useState } from "react";
import "./App.css";

const userId = localStorage.getItem("userId") || Math.random();
localStorage.setItem("userId", userId);

const ws = new WebSocket(`ws://localhost:3000/online-status`);

// optional
ws.onopen = function () {
	// ws.send("Hello, this from client react js");
	ws.send(
		JSON.stringify({
			onlineStatus: true,
			userId,
		}),
	);
};

function App() {
	const [usersOnlineCount, setUsersOnlineCount] = useState(0);
	const [onlineStatus, setOnlineStatus] = useState();

	useEffect(() => {
		ws.onmessage = function (message) {
			// console.log(`Message from server: ${message.data}`);
			const data = JSON.parse(message.data);
			setUsersOnlineCount(data.onlineUserCount);
		};
	}, []);

	const onOnlineStatusChange = (event) => {
		setOnlineStatus(event.target.value);
		if (!event.target.value) {
			return;
		}

		const isOnline = event.target.value === "online";
		ws.send(
			JSON.stringify({
				onlineStatus: isOnline,
				userId,
			}),
		);
	};

	return (
		<div>
			<div>Users Online Count - {usersOnlineCount}</div>

			<div>My Status</div>

			<select value={onlineStatus} onChange={onOnlineStatusChange}>
				<option value="">Select Online Status</option>
				<option value="online">Online</option>
				<option value="offline">Offline</option>
			</select>
		</div>
	);
}

export default App;
