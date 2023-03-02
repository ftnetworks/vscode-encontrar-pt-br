import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

let decorationsToClean: vscode.TextEditorDecorationType[] = []

const findWords = (editor: vscode.TextEditor) => {
	const dictionary = fs.readFileSync(path.join(__dirname, `pt-br.dict`), `utf-8`).split(`\n`)

	const content = editor.document.getText()
	const lines = content.split('\n')

	let lineCount = 0
	let linesToHighlight = []
	for (const line of lines) {
		const words = line.split(' ')

		for (let word of words) {
			word = word.toLowerCase().replace(/(<([^>]+)>)/ig, "").replace(/[^\w\s]/gi, '').trim()

			if (
				word.trim().length > 0
				&& dictionary.includes(word)
			) {
				linesToHighlight.push({ line: lineCount, word })
				break
			}
		}
		lineCount++
	}

	return linesToHighlight
}

const disposePreviousDecorations = () => {
	for (const decoration of decorationsToClean) {
		decoration.dispose()
	}
	decorationsToClean = []
}

const registerHighlightLines = (context: vscode.ExtensionContext) => {
	let disposable = vscode.commands.registerCommand('extension.highlightLines', async () => {
		const editor = vscode.window.activeTextEditor

		if (!editor) return

		disposePreviousDecorations()

		highlightLines(editor, findWords(editor))
	})
	context.subscriptions.push(disposable)
}

const registerClearHighlightedLines = (context: vscode.ExtensionContext) => {
	let disposable = vscode.commands.registerCommand('extension.clearLines', async () => {
		disposePreviousDecorations()
	})
	context.subscriptions.push(disposable)
}

export const activate = (context: vscode.ExtensionContext) => {
	registerHighlightLines(context)
	registerClearHighlightedLines(context)
}

const highlightLines = (editor: vscode.TextEditor, items: { line: number, word: string }[]) => {
	for (const item of items) {
		const decoration = vscode.window.createTextEditorDecorationType({
			backgroundColor: `rgba(255,0,0,.5)`,
			after: {
				contentText: ` Palavra: ${item.word} `,
				backgroundColor: `rgba(255,255,0,.5)`,
				color: `black`
			}
		})
		const line = editor.document.lineAt(item.line)
		const range = new vscode.Range(line.range.start, line.range.end)
		editor.setDecorations(decoration, [range])
		decorationsToClean.push(decoration)
	}
}