import React from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import SockJS from "sockjs-client";
import Stomp from "stompjs";

export interface ISyncViewConfig {
    syncServerUrl: string;
    imgUrl: string;
    userName: string;
}

interface IUserLocation {
    user: string;
    x: number;
    y: number;
}

export class SyncView extends React.Component<{ config: ISyncViewConfig }> {

    private camera?: THREE.PerspectiveCamera;
    private orbitControls?: OrbitControls;
    private renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
    private scene: THREE.Scene = new THREE.Scene();
    private raycaster = new THREE.Raycaster();
    private imgMesh?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    private stomp?: Stomp.Client;
    private oldMouse: any;
    private imgWidth = 0;
    private imgHeight = 0;
    private container = React.createRef<HTMLDivElement>();

    constructor(props: ISyncViewConfig) {
        super(props as any);
        window.addEventListener("resize", this.onResize.bind(this));
    }

    private loadImage() {
        const texture = new THREE.TextureLoader();
        texture.load(this.props.config.imgUrl, (texture) => {
            this.imgWidth = texture.image.width;
            this.imgHeight = texture.image.height;
            const geometry = new THREE.PlaneGeometry(this.imgWidth, this.imgHeight);
            const material = new THREE.MeshBasicMaterial({ map: texture });
            this.imgMesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.imgMesh);
        });
    }

    private animate(): void {
        if (this.orbitControls && this.camera) {
            this.orbitControls.update();
            requestAnimationFrame(this.animate.bind(this));
            this.renderer.render(this.scene, this.camera);
        }
    }

    private onResize(): void {
        if (this.camera && this.container && this.container.current) {
            this.camera.aspect = this.container.current.offsetWidth / this.container.current.offsetHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.current.offsetWidth, this.container.current.offsetHeight);
        }
    }

    componentDidMount() {
        if (this.container.current) {
            this.renderer.setSize(this.container.current.offsetWidth, this.container.current.offsetHeight);
            this.camera = new THREE.PerspectiveCamera(75,
                this.container.current.offsetWidth / this.container.current.offsetHeight, 1 / 99, 100000000000000);
            this.camera.position.z = 1000;
            this.orbitControls = new OrbitControls(this.camera, this.container.current);
            this.orbitControls.maxAzimuthAngle = 0;
            this.orbitControls.minAzimuthAngle = 0;
            this.orbitControls.maxPolarAngle = Math.PI / 2;
            this.orbitControls.minPolarAngle = Math.PI / 2;
            this.container.current.appendChild(this.renderer.domElement);
            this.container.current.addEventListener('mousemove', this.onMouseMove.bind(this), false);
            this.loadImage();
            this.animate();
            const sock = new SockJS(this.props.config.syncServerUrl);
            this.stomp = Stomp.over(sock);
            // this.stomp.debug = () => { };
            this.stomp.connect({}, () => {
                if (this.stomp) {
                    this.stomp.subscribe("/topic/state", (location) => {
                        this.updateUserLocation(JSON.parse(location.body));
                    });
                }
            });
        }

    }

    updateUserLocation(userLocation: IUserLocation) {
        const markerSize = this.imgWidth / 100;
        if (userLocation.user === this.props.config.userName) {
            return;
        }
        let extUser = false;
        for (let i = 0; i < this.scene.children.length; i++) {
            const child = this.scene.children[i];
            if (child.name === userLocation.user) {
                child.position.set(userLocation.x, userLocation.y, 0);
                extUser = true;
                break;
            }
        }
        if (!extUser) {
            const group = new THREE.Group();
            group.name = userLocation.user;
            group.position.set(userLocation.x, userLocation.y, 10);
            const material = new THREE.MeshBasicMaterial({ color: "white" });
            const geometry = new THREE.SphereGeometry(markerSize, 50, 50);
            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);
            const loader = new THREE.FontLoader();
            loader.load('optimer_bold.typeface.json', (font) => {
                const geometry = new THREE.TextGeometry(userLocation.user, {
                    font: font,
                    size: 20,
                    height: 1
                });
                const textMest = new THREE.Mesh(geometry, material);
                group.add(textMest);
            });
            this.scene.add(group);
        }
    }

    onMouseMove(event: MouseEvent) {
        if (this.container.current) {
            const mouse = new THREE.Vector2();
            mouse.x = (event.offsetX / this.container.current.offsetWidth) * 2 - 1;
            mouse.y = - (event.offsetY / this.container.current.offsetHeight) * 2 + 1;
            if (!this.oldMouse) {
                this.oldMouse = mouse;
            }
            const mouseMoveDist = Math.abs(mouse.distanceTo(this.oldMouse));
            if (mouseMoveDist <= 0) {
                return;
            }
            if (this.camera && this.imgMesh) {
                this.raycaster.setFromCamera(mouse, this.camera);
                var intersects = this.raycaster.intersectObject(this.scene.children[0], true);
                if (intersects.length === 1) {
                    const intersect = intersects[0];
                    const userLocation = {
                        user: this.props.config.userName,
                        x: intersect.point.x,
                        y: intersect.point.y
                    } as IUserLocation;
                    if (this.stomp && this.stomp.connected) {
                        this.stomp.send("/app/update-state", {}, JSON.stringify(userLocation));
                    }
                }
            }
        }
    }

    render() {
        return (
            <div style={{ width: "100%", height: "100%" }} ref={this.container as React.RefObject<HTMLDivElement>}></div>
        );
    }

}
