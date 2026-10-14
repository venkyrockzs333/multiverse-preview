// THE ARRIVAL: "The Specimen". Wireframe icosahedron + cheap fresnel glass core + inspection scan band + 3 orbit rings.
// Deliberately cheap: 3 tiny ShaderMaterials + 1 basic material, no env map, no transmission, no lights needed.
import * as THREE from 'three';

export function createArrival({ low }) {
  const group = new THREE.Group();
  group.name = 'arrival';
  const geo = new THREE.IcosahedronGeometry(2.4, 1);

  const scan = { value: 10 }, opacity = { value: 0 }, draw = { value: 0 };
  // edges: brighten where the scan band passes ("inspection")
  const edgeMat = new THREE.ShaderMaterial({
    uniforms: { uScan: scan, uOpacity: opacity, uDraw: draw },
    vertexShader: `varying float vY; varying float vR; void main(){ vY = position.y; vR = fract(sin(dot(position.xz, vec2(12.9898,78.233))) * 43758.5453); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uScan, uOpacity, uDraw; varying float vY; varying float vR;
      void main(){ float band = smoothstep(0.45, 0.0, abs(vY - uScan));
        float shown = step(vR, uDraw);
        vec3 base = vec3(0.643, 0.482, 1.0); vec3 hi = vec3(0.812, 0.761, 1.0);
        gl_FragColor = vec4(mix(base, hi, band), (0.35 + 0.65 * band) * uOpacity * shown);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false,
  });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
  group.add(edges);

  // core: fresnel glass, additive; reads as translucent solid without a second scene pass
  const coreMat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: opacity, uScan: scan },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vY = position.y; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uOpacity, uScan; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        float band = smoothstep(0.3, 0.0, abs(vY - uScan));
        vec3 col = mix(vec3(0.427, 0.247, 0.878), vec3(0.812, 0.761, 1.0), f) * (0.04 + 0.62 * f) + vec3(0.7, 0.65, 1.0) * band * 0.25;
        gl_FragColor = vec4(col * uOpacity, 1.0);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, low ? 1 : 2), coreMat);
  group.add(core);

  // orbit rings
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xcfc2ff, transparent: true, opacity: 0, depthWrite: false });
  const rings = [[3.2, 12], [3.8, -24], [4.6, 63]].map(([r, tilt], i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006 * (low ? 1.6 : 1), 6, low ? 96 : 128), ringMat);
    m.rotation.x = Math.PI / 2 + THREE.MathUtils.degToRad(tilt); m.rotation.y = i * 0.7;
    group.add(m); return m;
  });

  let intro = 0;
  return {
    group,
    get intro() { return intro; },
    setIntro(v) { intro = v; },
    // a: arrival presence (1 in hero, 0 after), t: seconds, mouse: {x,y}, still: reduced motion
    update(a, t, mouse, still) {
      const v = a * intro;
      group.visible = v > 0.003;
      if (!group.visible) return;
      opacity.value = v;
      draw.value = still ? 1 : Math.min(1, intro * 1.25);
      ringMat.opacity = 0.28 * v;
      scan.value = still ? 10 : 2.6 - ((t / 6) % 1) * 5.2; // sweeps top -> bottom every 6 s
      const s = 0.6 + 0.4 * intro;
      group.scale.setScalar(s);
      const spin = still ? 0 : t * 0.12;
      edges.rotation.set(0.35 + mouse.y * 0.1, -0.6 * (1 - intro) + spin + mouse.x * 0.1, 0);
      core.rotation.copy(edges.rotation);
      if (!still) rings.forEach((r, i) => { r.rotation.z = t * (0.02 + i * 0.015); });
    },
  };
}
