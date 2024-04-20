import { Events } from "../events";

class CompareSelection {
    ToolName = 'CompareSelection';

    events: Events;
    root: HTMLElement;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    svg: SVGElement;
    circle: SVGCircleElement;
    dragging = false;
    radius = 5;
    prev = { x: 0, y: 0 };
    refresh = false;

    constructor(events: Events, parent: HTMLElement) {
        // create input dom
        const root = document.createElement('div');
        root.id = 'select-root';

        // create svg
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = 'select-svg';
        svg.style.display = 'inline';

        // create circle element
        const circle = document.createElementNS(svg.namespaceURI, 'circle') as SVGCircleElement;
        circle.setAttribute('r', this.radius.toString());
        circle.setAttribute('fill', 'rgba(255, 102, 0, 0.2)');
        circle.setAttribute('stroke', '#f60');
        circle.setAttribute('stroke-width', '1');
        circle.setAttribute('stroke-dasharray', '5, 5');

        // create canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'select-canvas';

        const context = canvas.getContext('2d');
        context.globalCompositeOperation = 'copy';

        const update = (e: MouseEvent) => {
            const x = e.offsetX;
            const y = e.offsetY;

            circle.setAttribute('cx', x.toString());
            circle.setAttribute('cy', y.toString());         
        };

        root.oncontextmenu = (e) => {
            e.preventDefault();
        };

        root.onmousedown = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const x = this.prev.x = e.offsetX;
            const y = this.prev.y = e.offsetY;
            
            update(e);

         
            if (e.button === 0) {
                this.dragging = true;
                
                context.beginPath();
                context.arc(x, y, this.radius, 0, 2 * Math.PI, false);
                context.fillStyle = 'red'; // Change the color of the selected point
                context.fill();
                
                if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
                    canvas.width = parent.clientWidth;
                    canvas.height = parent.clientHeight;
                }

                this.events.fire(
                    'selectByMaskCompare',
                     e.shiftKey ? 'add' : (e.ctrlKey ? 'remove' : 'set'),
                    context.getImageData(0, 0, canvas.width, canvas.height),
                    this.refresh
                );

                // clear canvas
                context.clearRect(0, 0, canvas.width, canvas.height);

                // display it
                canvas.style.display = 'inline';
            }
            this.refresh = false;
        };

        root.onmousemove = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const x = e.offsetX;
            const y = e.offsetY;

            circle.setAttribute('cx', x.toString());
            circle.setAttribute('cy', y.toString());
        };

      
        parent.appendChild(root);
        root.appendChild(svg);
        svg.appendChild(circle);
        root.appendChild(canvas);

        // events.on('brushSelection:smaller', () => {
        //     this.smaller();
        // });

        this.events = events;
        this.root = root;
        this.svg = svg;
        this.circle = circle;
        this.canvas = canvas;
        this.context = context;

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    }

    activate() {
        this.root.style.display = 'block';
        this.refresh = true;
    }

    deactivate() {
        this.root.style.display = 'none';
        this.refresh = true;
    }

    // smaller() {
    //     this.radius = Math.max(1, this.radius / 1.05);
    //     this.circle.setAttribute('r', this.radius.toString());
    // }

}

export { CompareSelection };
