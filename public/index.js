import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

("use strict");

const DEBUG = false;

$(function () {
  $("#prompt-form img").on("click tap", async () => {
    $("body").addClass("loading");
    const prompt = $("#prompt").val();
    try {
      const res = await fetch("http://localhost:5000/api/object", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      const { id } = await res.json();

      if (DEBUG) {
        load([
          `https://storage.googleapis.com/fuzzy_fusion/456.obj`,
          `https://storage.googleapis.com/fuzzy_fusion/456.mtl`,
          `https://storage.googleapis.com/fuzzy_fusion/456.mp4`,
        ]);
      } else {
        let urls;
        const interval = setInterval(async () => {
          console.log("called")
          const res = await fetch(`http://localhost:5000/api/object/${id}`);
          const json = await res.json();
          urls = json.urls;
          if (urls.length) {
            load(urls);
            clearInterval(interval);
          }
          console.log(urls);
        }, 100000);
      }

    } catch (err) {
      console.log(err);
    }
  });

  $(".btns .btn:last-child").on("click tap", function () {
    console.log("here")
    $(".tooltip").addClass("active");
    setTimeout(() => { $(".tooltip").removeClass("active"); }, 3000);
    navigator.clipboard.writeText($(this).attr("data-href"));
    alert("Copied the text: " + copyText.value);
  });

  function load(urls) {
    $("body").removeClass("loading");
    $(".btns .btn:nth-child(2)").attr("href", urls[0]);
    $(".btns .btn:last-child").attr("data-href", urls[0]);
    console.log(urls);
    const width = $("#loader").innerWidth();
    const height = $("#loader").innerHeight();
    const [canvas] = $("#loader canvas");

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 10);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 2.5, 0);
    controls.update();

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.65);
    directionalLight.position.set(0, 10, 0);
    directionalLight.target.position.set(-5, 0, 0);
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    const hemisphereLight = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 0.65);
    scene.add(hemisphereLight);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      // alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    const mtlLoader = new MTLLoader();
    mtlLoader.setMaterialOptions({ invertTrProperty: true });
    mtlLoader.load(
      urls[1],
      (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(
          urls[0],
          (object) => {
            object.scale.set(10, 10, 10);
            scene.add(object);
          },
          undefined,
          (err) => {
            console.log(err);
          }
        );
      },
      undefined,
      (err) => {
        console.log(err);
      }
    );
  }
});
