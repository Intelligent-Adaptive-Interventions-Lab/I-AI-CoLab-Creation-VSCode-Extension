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

        // separate between text and code lines

        // paste the answer to the notebook
        let nb = {
          metadata: { name: "Test 1" },
          cells: [
            {
              cell_type: "markdown",
              metadata: {},
              source: generatedText,
            },
          ],
          nbformat: 4,
          nbformat_minor: 4,
        };

        // TODO: Fix the path
        // Save the notebook to disk
        let notebookPath = `...`;
        // if (workspaceFolders) {
        //   notebookPath = `${workspaceFolders[0].uri.path}/Untitled.ipynb`;
        // } else {
        //   // Use a default path if workspaceFolders is not found
        //   notebookPath = `${vscode.env.appName}/Untitled.ipynb`;
        // }

        let notebookContents = JSON.stringify(nb);
        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(notebookPath),
          Buffer.from(notebookContents)
        );

        // Open the new notebook in a VS Code editor
        let notebookUri = vscode.Uri.file(notebookPath);
        let notebookEditor = await vscode.window.showNotebookDocument(
          notebookUri,
          {
            viewColumn: vscode.ViewColumn.Active,
          }
        );
        const editor = vscode.window.activeNotebookEditor;
        if (!editor) {
          let notebookDocument = await vscode.workspace.openNotebookDocument(
            "jupyter-notebook"
          );
          editor = await vscode.window.showNotebookDocument(notebookDocument);
          let cell = notebookDocument.createCell("markdown", "New cell");
          notebookDocument.cells = [cell];
        }

        let content = editor.document.getText();
        let notebook = nbformat.reads(content, nbformat.NO_CONVERT);
        let new_cell = nbformat.createMarkdownCell(generatedText);
        notebook.cells.push(new_cell);

        let newContent = nbformat.writes(notebook, nbformat.nO_CONVERT);
        editor.edit((builder) => {
          let documentStart = new vscode.Position(0, 0);
          let documentEnd = new vscode.Position(editor.document.lineCount, 0);
          let documentRange = new vscode.Range(documentStart, documentEnd);
          builder.replace(documentRange, newContent);
        });
      } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage(
          "An error occurred while generating text."
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
