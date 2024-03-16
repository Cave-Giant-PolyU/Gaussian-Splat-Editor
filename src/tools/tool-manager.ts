import { Events } from '../events';

interface Tool {
    ToolName: string;

    activate: () => void;
    selectActivate: (index: number) => void;
    deactivate: () => void;
}

class ToolManager {
    tools = new Map<string, Tool>();
    events: Events;
    active: Tool | null = null;
    selectActive: Tool | null = null;

    constructor(events: Events) {
        this.events = events;

        this.events.on('tool:activate', (toolName: string) => {
            this.activate(toolName);
        });
        this.events.on('fileSelectTool:activate', (toolName: string, toolIndex: string) => {
            this.selectActivate(toolName,toolIndex);
        });
        //好像是错误的
        this.events.function('tool:active', () => {
            return this.active?.ToolName;
        });
        this.events.function('fileSelectTool:active', () => {
            return this.selectActive?.ToolName;
        });
    }

    register(tool: Tool) {
        this.tools.set(tool.ToolName, tool);
    }

    get(toolName: string) {
        return (toolName && this.tools.get(toolName)) ?? null;
    }
    selectActivate(toolName: string | null, toolIndex: string | null) {
        const newTool = this.get(toolName);
        if(this.active != null){
            this.activate(null);
        }
        if (newTool === this.selectActive) {
            // re-activating the currently active tool deactivates it
            if (newTool) {
                this.selectActivate(null,null);
            }
        }else{
            // deactive old tool
            if (this.selectActive) {
                this.selectActive.deactivate();            }
            this.selectActive = newTool;
            // activate the new
            if (this.selectActive) {
                let numberToolIndex = parseInt(toolIndex);
                this.selectActive.selectActivate(numberToolIndex);
            }
            this.events.fire('fileSelectTool:activated', this.selectActive?.ToolName ?? null, (toolIndex?? 'default').toString());
        }
    }
    //更改过源码（添加单独选择文件的激活的事件）
    activate(toolName: string | null) {
        const newTool = this.get(toolName);
        if(this.selectActive != null){
            this.selectActivate(null,null);
        }
        if (newTool === this.active) {
            // re-activating the currently active tool deactivates it
            if (newTool) {
                this.activate(null);
            }
        } else {
            // deactive old tool
            if (this.active) {
                this.active.deactivate();
                this.events.fire('tool:deactivated', this.active.ToolName);
            }

            this.active = newTool;

            // activate the new
            if (this.active) {
                this.active.activate();
            }

            this.events.fire('tool:activated', this.active?.ToolName ?? null);
        }
    }
}

export { ToolManager };
