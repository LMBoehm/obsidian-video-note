import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

function toLink(name, url) {
    return `[${name}](${url})`;
}

function getFrontMatter(tags) {
    tag_str = ''
    for (let k in tags) {
        tag_str += `${k}: ${tags[k]}\n`
    }
    console.log(tag_str)
    return '---\n' + tag_str + '---\n\n'

}

async function getYouTubeInfo(video_url: string) {
	var tags = {};
	console.log(video_url)
	let data = ""
	try {
		data = await requestUrl({ url: `https://youtube.com/oembed?url=${video_url}` }).json;
	} catch (error) {
		new Notice(`Didn't get infro from url: ${video_url}`);
		return ["", ""];
	}

	tags["author"] = data.author_name;
	tags["title"] = data.title;
	const channel_url = data.author_url;
	tags["channel"] = channel_url.split("@")[1];
	tags["today"] = new Date().toISOString().split("T")[0];
	tags["tags"] = "";

	// channel link
	const channel_link = toLink(tags["channel"], channel_url);

	// video link
	const video_link = toLink(tags["title"], video_url);

	const val_title = tags["title"].replace(":", "_");

	const tags_str = getFrontMatter(tags);
	const title_str = `# [[${val_title}]]\n\n`;

	const links = `## links\n\n${video_link}\n\n${channel_link}\n\n`;

	console.log(val_title);
	return [val_title, tags_str + title_str + links];
}

export default class VideoNote extends Plugin {
	// settings: VideoNoteSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "create-new-video-note",
			name: "create new video note from clipboard",
			callback: async () => {
				console.log("hello")
				const clipText = await navigator.clipboard.readText();
				console.log(`clipboard: ${clipText}`)
				var [title, body] = await getYouTubeInfo(clipText);
				if (Boolean(title) == false) {
					return;
				}

				const { vault } = this.app;
				const { adapter } = vault;

				const filePath = `talks/${title}.md`;

				try {
					const fileExists = await adapter.exists(filePath);
					if (fileExists) {
						// If the file already exists, respond with error
						throw new Error(`${filePath} already exists`);
					}
					const File = await vault.create(filePath, body);
					// Create the file and open it in the active leaf
					let leaf = this.app.workspace.getLeaf(false);
					if (this.mode === NewFileLocation.NewPane) {
						leaf = this.app.workspace.splitLeafOrActive();
					} else if (this.mode === NewFileLocation.NewTab) {
						leaf = this.app.workspace.getLeaf(true);
					} else if (!leaf) {
						// default for active pane
						leaf = this.app.workspace.getLeaf(true);
					}
					await leaf.openFile(File);
				} catch (error) {
					new Notice(error.toString());
				}
			},
		});

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000));
	}

	onunload() {}

	async loadSettings() {
		// this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		// await this.saveData(this.settings);
	}
}
