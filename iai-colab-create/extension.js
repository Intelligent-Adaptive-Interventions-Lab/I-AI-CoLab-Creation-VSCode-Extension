// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const { Configuration, OpenAIApi } = require("openai");
const nbformat = require("nbformat");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "iai-colab-create" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "iai-colab-create.askGPT",
    async function () {
      // Get the active notebook document or create a new one if none is active
      let notebook = vscode.window.activeNotebookEditor?.document;
      if (!notebook) {
          vscode.window.showNotebookDocument({ viewColumn: vscode.ViewColumn.One }).then(newNotebook => {
              notebook = newNotebook;
              handleNotebookDocument(notebook);
          }).catch(err => {
              vscode.window.showErrorMessage('Failed to create a new notebook document: ' + err);
          });
      } else {
          handleNotebookDocument(notebook);
      }
    }
  );

  context.subscriptions.push(disposable);
}

function handleNotebookDocument(notebook) {
  // The code you place here will be executed every time your command is executed
  const prompt = await vscode.window.showInputBox({
    prompt: "Enter your prompt: ",
  });
  if (!prompt) {
    return;
  }

  console.log(prompt);

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });
    console.log(response);
    const generatedText = response.data.choices[0].message.content;
    vscode.window.showInformationMessage(generatedText);

    // Get the active cell
    const activeCell = vscode.window.activeNotebookEditor?.selection?.active;
    if (!activeCell) {
        vscode.window.showErrorMessage('No active cell found.');
        return;
    }

    // Get the active notebook URI
    const notebookUri = notebook.uri;

    // Create a new cell with the selected text
    const newCell = {
        cellKind: vscode.CellKind.Code,
        source: generatedText,
    };

    // Add the new cell to the active notebook document
    vscode.workspace.openNotebookDocument(notebookUri).then(notebookDocument => {
        const edit = new vscode.WorkspaceEdit();
        const lastCellIndex = notebookDocument.cells.length;
        edit.replaceNotebookCells(notebookUri, new vscode.NotebookRange(lastCellIndex, lastCellIndex), [newCell]);
        return vscode.workspace.applyEdit(edit);
    }).then(success => {
        if (success) {
            vscode.window.showInformationMessage('Text pasted to a new cell.');
        } else {
            vscode.window.showErrorMessage('Failed to paste text to a new cell.');
        }
    }).catch(err => {
        vscode.window.showErrorMessage('An error occurred while pasting text to a new cell: ' + err);
    });
    
    
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage(
      "An error occurred while generating text."
    );
  }
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
