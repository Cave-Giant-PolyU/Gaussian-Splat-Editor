import { Entity, StandardMaterial, Vec3 } from 'playcanvas';
import { TransformGizmo } from 'playcanvas-extras';
import { ElementType } from '../element';
import { Scene } from '../scene';
import { Splat } from '../splat';
import { Events } from '../events';
import { EditHistory, EditOp } from '../edit-history';
import { EntityTransformOp } from '../edit-ops';
import { InfoWindow } from '../ui/info-window';
import { EditorUI } from '../ui/editor';

//import { debounce } from 'lodash';

const patchGizmoMaterials = (gizmo: TransformGizmo) => {
    const patch = (material: StandardMaterial) => {
        material.opacity = 0.8;
    };

    // patch opacity
    const axis = gizmo._materials.axis;
    patch(axis.x.cullBack);
    patch(axis.x.cullNone);
    patch(axis.y.cullBack);
    patch(axis.y.cullNone);
    patch(axis.z.cullBack);
    patch(axis.z.cullNone);
    patch(axis.face);
    patch(axis.xyz);

    const disabled = gizmo._materials.disabled;
    patch(disabled.cullBack);
    patch(disabled.cullNone);
};

class TransformTool {
    scene: Scene;
    gizmo: TransformGizmo;
    entities: Entity[] = [];
    ops: any[] = [];
    infoWindow: InfoWindow;
    editorUI: EditorUI;
    constructor(gizmo: TransformGizmo, events: Events, editHistory: EditHistory, scene: Scene) {
        this.scene = scene;
        this.gizmo = gizmo;

        // patch gizmo materials (until we have API to do this)
        patchGizmoMaterials(this.gizmo);

        this.gizmo.coordSpace = events.call('tool:coordSpace');
        this.gizmo.size = 1.5;

        this.gizmo.on('render:update', () => {
            scene.forceRender = true;
        });
        // 提高性能 0.5s更新一次
        let positionUpdateHandler = async (position: pc.Vec3) => {
            this.gizmo.off('position:update', positionUpdateHandler);
            await this.updateTransformInfo(position);
            setTimeout(() => {
                this.gizmo.on('position:update', positionUpdateHandler);
            }, 500);
        };
        
        let rotationUpdateHandler = async (rotation: pc.Vec3) => {
            this.gizmo.off('rotation:update', rotationUpdateHandler);
            await this.updateRotateInfo(rotation);
            setTimeout(() => {
                this.gizmo.on('rotation:update', rotationUpdateHandler);
            }, 500);
        };
        
        this.gizmo.on('position:update', positionUpdateHandler);
        this.gizmo.on('rotation:update', rotationUpdateHandler);

        this.gizmo.on('transform:start', () => {
            this.ops = this.entities.map((entity) => {
                return {
                    entity: entity,
                    old: {
                        position: entity.getLocalPosition().clone(),
                        rotation: entity.getLocalRotation().clone(),
                        scale: entity.getLocalScale().clone()
                    },
                    new: {
                        position: entity.getLocalPosition().clone(),
                        rotation: entity.getLocalRotation().clone(),
                        scale: entity.getLocalScale().clone()
                    }
                }
            });
        });

        this.gizmo.on('transform:move', () => {
            scene.updateBound();
            if (this.ops.length == 1) {
                this.updataScaleInfo();
            }
        });

        this.gizmo.on('transform:end', () => {
            // update new transforms
            this.ops.forEach((op) => {
                const e = op.entity;
                op.new.position.copy(e.getLocalPosition());
                op.new.rotation.copy(e.getLocalRotation());
                op.new.scale.copy(e.getLocalScale());
            });
            // filter out ops that didn't change
            this.ops = this.ops.filter((op) => {
                const e = op.entity;
                return !op.old.position.equals(e.getLocalPosition()) ||
                       !op.old.rotation.equals(e.getLocalRotation()) ||
                       !op.old.scale.equals(e.getLocalScale());
            });
            if (this.ops.length > 0) {
                editHistory.add(new EntityTransformOp(scene, this.ops));
                this.ops = [];
            }
        });

        events.on('scene:bound:changed', (editOp: EditOp) => {
            if (this.entities) {
                this.gizmo.attach(this.entities);
            }
        });

        events.on('tool:coordSpace', (coordSpace: string) => {
            this.gizmo.coordSpace = coordSpace;
            scene.forceRender = true;
        });
        //根据键盘移动
        events.on('keyMovement',(direction:string ,pace: string) => {
            let moveDistance = 1; // default move distance
            if(pace == "More"){
                moveDistance = 0.1; 
            }
            if(this.entities[0] != null){
                console.log("direction: " + direction);
                if(direction == "MoveOnXleft"){
                    this.entities[0].translateLocal(-moveDistance,0,0);
                }else if (direction == "MoveOnXright"){
                    this.entities[0].translateLocal(moveDistance,0,0);
                }else if(direction == "MoveOnYup"){
                    this.entities[0].translateLocal(0,moveDistance,0);
                }else if(direction == "MoveOnYdown"){
                    this.entities[0].translateLocal(0,-moveDistance,0);
                }else if(direction == "MoveOnZfront"){
                    this.entities[0].translateLocal(0,0,moveDistance);
                }else if(direction == "MoveOnZback"){
                    this.entities[0].translateLocal(0,0,-moveDistance);
                }
            }
        });
        //会多次触发
        let isProcessing = false;

        events.on('EditLocation', (operation: string, dimension: string, value: string) => {
            if (isProcessing) {
                return;
            }
        
            isProcessing = true;
            this.setLocation(operation, dimension, value);
            setTimeout(() => {
                isProcessing = false;
            }, 500);
        });
    }
    setLocation(operation: string, dimension: string, value: string) {
        if(this.entities[0] != null){
            if(operation == "transform"){
                let position = this.entities[0].getLocalPosition();
                if(dimension == "X"){
                    if(position.x != parseFloat(value)){
                        position.x = parseFloat(value);
                    }
                }else if(dimension == "Y"){
                    if(position.y != parseFloat(value)){
                        position.y = parseFloat(value);
                    }
                }else if(dimension == "Z"){
                    if(position.z != parseFloat(value)){
                        position.z = parseFloat(value);
                    }
                }
                this.entities[0].setLocalPosition(position);
        }else if(operation == "rotate"){
            let rotation = this.entities[0].getLocalEulerAngles();
            if(dimension == "X"){
                if(rotation.x != parseFloat(value)){
                    rotation.x = parseFloat(value);
                }
            }else if(dimension == "Y"){
                if(rotation.y != parseFloat(value)){
                    rotation.y = parseFloat(value);
                }
            }else if(dimension == "Z"){
                if(rotation.z != parseFloat(value)){
                    rotation.z = parseFloat(value);
                }
            }
            this.entities[0].setLocalEulerAngles(rotation);
        }else if(operation == "scale"){
            let scale = this.entities[0].getLocalScale();
            if(dimension == "X"){
                if(scale.x != parseFloat(value)){
                    scale.x = parseFloat(value);
                }
            }else if(dimension == "Y"){
                if(scale.y != parseFloat(value)){
                    scale.y = parseFloat(value);
                }
            }else if(dimension == "Z"){
                if(scale.z != parseFloat(value)){
                    scale.z = parseFloat(value);
                }
            }
            this.entities[0].setLocalScale(scale);
        }
    }
}
    //选择文件激活
    selectActivate(index: number, editorUI: EditorUI) {
        this.editorUI = editorUI;
        let indexSplat = this.scene.getElementsByType(ElementType.splat)[index];
        if (indexSplat != null) {
            let indexSplatEntity = indexSplat.entity;
            let selectScale = indexSplatEntity.getLocalScale();
            this.entities = [indexSplatEntity];
            this.gizmo.attach([indexSplatEntity]);
            this.editorUI.infoWindow.headerText = indexSplat.asset.name;

            this.editorUI.infoWindow.setScale(selectScale.x, selectScale.y, selectScale.z);
        }
    }
    // 更新infoWindow的值
    updateTransformInfo(position: pc.Vec3): Promise<void> {
        return new Promise(resolve => {
            this.editorUI?.infoWindow?.setTransform(position.x, position.y, position.z);
            resolve();
        });
    }

    updateRotateInfo(rotation: pc.Vec3): Promise<void> {
        return new Promise(resolve => {
            this.editorUI?.infoWindow?.setRotate(rotation.x, rotation.y, rotation.z);
            resolve();
        });
    }
    updataScaleInfo() {
        let op = this.ops[0];
        let LocalScale = op.entity.getLocalScale();
        this.editorUI.infoWindow.setScale(LocalScale.x, LocalScale.y, LocalScale.z);
    }
    clearScaleInfo() {
        this.editorUI.infoWindow.setScale(-1, -1, -1);
    }
    activate(EditorUI: EditorUI) {
        //目前没有做全局变化
        this.editorUI = EditorUI;
        this.editorUI.infoWindow.setScale(-1, -1, -1);
        //源码
        this.entities = this.scene.getElementsByType(ElementType.splat).map((splat: Splat) => splat.entity);
        this.gizmo.attach(this.entities);
        this.editorUI.infoWindow.headerText = "Whole Scene";
    }

    deactivate() {
        //源码
        this.gizmo.detach();
        this.entities = [];
    }

}

export { TransformTool };
