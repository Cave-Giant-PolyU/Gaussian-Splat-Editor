import { BooleanInput, Button, Container, Label, NumericInput, Panel, RadioButton, SelectInput, SliderInput, VectorInput } from 'pcui';
import { Events } from '../events';

export class InfoWindow extends Panel {
    closeButton: Button;
    transformInput: VectorInput;
    rotateInput: VectorInput;
    scaleInput: VectorInput;
    constructor(events: Events, args = {}) {
        Object.assign(args, {
            headerText: `Current Object Info`,
            id: 'info-panel',
            class: 'info-window',
            resizable: 'left',
            resizeMax: 1000,
            collapsible: true,
            collapseHorizontally: false,    
        });

        super(args);
       
        const transformRow = new Container({
            class: 'info-row'
        });
        
        const transformInfoLabel = new Label({
            class: 'control-label',
            text: 'Transform'
        });

        this.transformInput = new VectorInput({
            class: 'control-element-expand',
            precision: 4,
            dimensions: 3,
            value: [0, 0, 0],
            // @ts-ignore
            placeholder: ['X', 'Y', 'Z'],
        });
        addInputListeners(this.transformInput, 'transform');
        transformRow.append(transformInfoLabel);
        transformRow.append(this.transformInput);
        
        // 创建rotate的标签和输入框
        const rotateLabel = new Label({
            class: 'control-label',
            text: 'Rotate'
        });

        this.rotateInput = new VectorInput({
            class: 'control-element-expand',
            precision: 4,
            dimensions: 3,
            value: [0, 0, 0],
            // @ts-ignore
            placeholder: ['X', 'Y', 'Z']
        });

        const rotateRow = new Container({
            class: 'info-row'
        });

        addInputListeners(this.rotateInput, 'rotate');
        rotateRow.append(rotateLabel);
        rotateRow.append(this.rotateInput);
        // 创建scale的标签和输入框
        const scaleLabel = new Label({
            class: 'control-label',
            text: 'Scale'
        });

        this.scaleInput = new VectorInput({
            class: 'control-element-expand',
            precision: 4,
            dimensions: 3,
            value: [1, 1, 1],
            // @ts-ignore
            placeholder: ['X', 'Y', 'Z']
        });

        const scaleRow = new Container({
            class: 'info-row'
        });
        addInputListeners(this.scaleInput, 'scale');
        scaleRow.append(scaleLabel);
        scaleRow.append(this.scaleInput);
        
        this.append(transformRow);
        this.append(rotateRow);
        this.append(scaleRow);

        //有错误会触发3次 搞不懂
        function addInputListeners(vectorInput: VectorInput, operation: string) {
            requestAnimationFrame(() => {
                const inputElements = Array.from(vectorInput.dom.querySelectorAll('input'));
                inputElements.forEach((inputElement, index) => {
                    const dimension = ['X', 'Y', 'Z'][index];
                    inputElement.addEventListener('input', (event: Event) => {
                        
                        const value = (event.target as HTMLInputElement).value;
                  
                        events.fire('EditLocation',operation,dimension, value);
                    });
                });
            });
        }
    }
    setTransform(x: number, y: number, z: number) {
        this.transformInput.value = [x, y, z];
    }
    setRotate(x: number, y: number, z: number) {
        this.rotateInput.value = [x, y, z];
    }
    setScale(x: number, y: number, z: number) {
        this.scaleInput.value = [x, y, z];
    }
    
}