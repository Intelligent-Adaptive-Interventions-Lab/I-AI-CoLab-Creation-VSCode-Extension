// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const { Configuration, OpenAIApi } = require("openai");
const nbformat = require("nbformat");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function activate(context) {
  console.log(
    'Congratulations, your extension "iai-colab-create" is now active!'
  );

  let disposable = vscode.commands.registerCommand(
    "iai-colab-create.askGPT",
    async function () {
      let notebook = vscode.window.activeNotebookEditor?.document;
      if (!notebook) {
        createNewNotebook()
          .then((newNotebook) => {
            notebook = newNotebook;
            handleNotebookDocument(notebook);
          })
          .catch((err) => {
            vscode.window.showErrorMessage(
              "Failed to create a new notebook document: " + err
            );
          });
      } else {
        handleNotebookDocument(notebook);
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function createNewNotebook() {
  const notebookUri = vscode.Uri.parse("untitled:Untitled.ipynb");
  const content = new Uint8Array(
    Buffer.from(
      JSON.stringify({
        cells: [],
        metadata: {
          kernelspec: {
            display_name: "Python 3",
            language: "python",
            name: "python3",
          },
          language_info: {
            codemirror_mode: {
              name: "ipython",
              version: 3,
            },
            file_extension: ".py",
            mimetype: "text/x-python",
            name: "python",
            nbconvert_exporter: "python",
            pygments_lexer: "ipython3",
            version: "3.7.6",
          },
        },
        nbformat: 4,
        nbformat_minor: 2,
      })
    )
  );

  return vscode.workspace.openNotebookDocument(notebookUri, { content });
}

async function handleNotebookDocument(notebook) {
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

    const activeCell = vscode.window.activeNotebookEditor?.selection?.active;
    if (!activeCell) {
      vscode.window.showErrorMessage("No active cell found.");
      return;
    }

    const notebookUri = notebook.uri;
    const newCell = {
      cellKind: vscode.CellKind.Code,
      source: generatedText,
      language: "python",
    };

    vscode.workspace
      .openNotebookDocument(notebookUri)
      .then((notebookDocument) => {
        const edit = new vscode.WorkspaceEdit();
        const lastCellIndex = notebookDocument.cells.length;
        const cellRange = new vscode.NotebookCellRange(
          lastCellIndex,
          lastCellIndex
        );
        edit.replaceNotebookCells(notebookUri, cellRange, [newCell]);
        return vscode.workspace.applyEdit(edit);
      })
      .then((success) => {
        if (success) {
          vscode.window.showInformationMessage("Text pasted to a new cell.");
        } else {
          vscode.window.showErrorMessage("Failed to paste text to a new cell.");
        }
      })
      .catch((err) => {
        vscode.window.showErrorMessage(
          "An error occurred while pasting text to a new cell: " + err
        );
      });
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage("An error occurred while generating text.");
  }
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
