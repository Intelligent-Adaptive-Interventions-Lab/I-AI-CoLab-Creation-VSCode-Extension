// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const {
	Configuration,
	OpenAIApi
} = require("openai");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// configure OpenAI api
	const configuration = new Configuration({
		apiKey: "sk-putYourApiKeyHere",
	});
	const openai = new OpenAIApi(configuration);

	let disposable = vscode.commands.registerCommand('iai-colab-create.sendGPTQuery', async () => {
		try {
			//display input box
			const query = await vscode.window.showInputBox({
				prompt: 'Enter your query'
			});

			//send api request to openai
			const completion = await openai.createCompletion({
				model: "text-davinci-003",
				prompt: query,
				max_tokens: 10
			}, {
				timeout: 1000
			});

			//print results
			console.log(completion.data.choices[0].text);
		} catch (error) {
			if (error.response) {
				console.log(error.response.status);
				console.log(error.response.data);
			} else {
				console.log(error.message);
			}
		}
	});


	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}