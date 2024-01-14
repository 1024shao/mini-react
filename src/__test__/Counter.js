// import React, { useState, Component } from "../mini-react/react";
import React, { useState, Component } from "react";

class CounterClass extends Component {
	constructor(props) {
		super(props);
		this.state = { count: 0 };
	}

	increment = () => {
		this.setState((prevState) => ({ count: prevState.count + 1 }));
	};

	render() {
		return (
			<div>
				<p>Count: {this.state.count}</p>
				<button onClick={this.increment}>Increment</button>
			</div>
		);
	}
}

function CounterFunction() {
	const [count, setCount] = useState(0);

	const increment = () => {
		setCount(count + 1);
	};

	return (
		<div>
			<p>Count: {count}</p>
			<button onClick={increment}>Increment</button>
		</div>
	);
}

export { CounterClass, CounterFunction };
