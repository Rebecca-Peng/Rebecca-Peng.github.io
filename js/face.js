function main() {
  const canvas = document.querySelector('#c2');
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.autoClearColor = false;

  const camera = new THREE.OrthographicCamera(
    -1, // left
     1, // right
     1, // top
    -1, // bottom
    -1, // near,
     1, // far
  );
  const scene = new THREE.Scene();
  const plane = new THREE.PlaneBufferGeometry(2, 2);
  const fragmentShader = `
  #include <common>

  uniform vec3 iResolution;
  uniform float iTime;

  #define S(a,b,t) smoothstep(a,b,t)

  vec4 _MainTex_ST;
  float _Size;

  float N21(vec2 p){
      p = fract(p * vec2(123.24,345.45));
      p += dot(p,p + 34.345);
      return fract(p.x * p.y);
  }

  float Circle(vec2 uv, vec2 p, float r, float blur){
      float d = length(uv - p);
      float c = S(r,r-blur,d);
     
      return c;
  }

  float Drop(vec2 UV, float t){
      vec2 aspect = vec2(2,1);
      vec2 uv = UV * 1. * aspect;
      uv.y += t * .25;
      vec2 gv = fract(uv) - .5;
      vec2 id = floor(uv);
     
      float n = N21(id);
      t += n * 6.2831;
     
      float w = UV.y * 10.;
      float x = (n - .5) * .8;
      x += (.4 - abs(x)) * sin(3. * w) * pow(sin(w), 6.) * .45;
      float y = -sin(t + sin(t + sin(t) * .5));
    y -= (gv.x - x)* (gv.x - x);
     
      vec2 dropPos = (gv - vec2(x ,y))/aspect;
    float drop = S(.05,.03,length(dropPos));

    vec2 trailPos = (gv - vec2(x, t * .25)) / aspect;
    trailPos.y = (fract(trailPos.y * 8.) - .5) / 8.;
    float trail = S(.03,.01,length(trailPos));
    float fogTrail = 0.;
    fogTrail = S(-.05,.05,dropPos.y);
    fogTrail *= S(.5,y,gv.y);
    trail *= fogTrail;
    float m = drop + trail;

    return m;
  }

  float Face(vec2 uv, float t) {
    vec2 gv = uv;
    float x = 0.;
    float y = 0.;
    float w = gv.y * 10. * sin(t);
    x += (.5 - abs(x)) * sin(3. * w) * pow(sin(w), 6.) * .2;
    w = gv.x * 10. * cos(t);
    y += (.5 - abs(y)) * sin(3. * w) * pow(sin(w), 6.) * .1;
         
    float mask = Circle(gv,vec2(x,y), .4, .05);
    mask -= Circle(uv, vec2(-.13 + x , .2 + y), .07, .01);
    mask -= Circle(uv, vec2(.13 + x, .2 + y), .07, .01);

    float mouth = Circle(uv, vec2(x, y), .3, .02);
    mouth -= Circle(uv, vec2(0. +x, 0.1 + y), .3, .02);
    mask -= mouth;

    vec2 id = floor(uv);

    float n = N21(id) * 6.2813;
    vec2 dropPos1 = vec2(x, .2+ y - .45 * fract(N21(uv) + .65 * (sin(t) * sin(t) + t)));

    vec2 dropPos2 = vec2( x, .2+ y - .45 * fract(N21(uv) + .65 * (sin(t) * sin(t) + t)));
    float drop = Circle(uv,dropPos1, .5, .3); //sin(t + sin(t + sin(t) * .5)))

    float trail = 0.;
               
    mask += drop;

    return mask;
  }


  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      // Normalized pixel coordinates (from 0 to 1)
      vec2 uv = fragCoord/iResolution.xy;
      float t = mod(iTime,7200.);
      uv -= .5;

      // Time varying pixel color
      vec3 col = vec3(0);
      float face = Face(uv, t);
      col += vec3(1.,0.,0.) * face;

      // Output to screen
      fragColor = vec4(col,1.0);
  }
  void main() {
      mainImage(gl_FragColor, gl_FragCoord.xy);
    }
    `;
 const uniforms = {
    iTime: { value: 0 },
    iResolution:  { value: new THREE.Vector3() },
  };
  const material = new THREE.ShaderMaterial({
    fragmentShader,
    uniforms,
  });
  scene.add(new THREE.Mesh(plane, material));
 
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render(time) {
    time *= 0.001;  // convert to seconds

    resizeRendererToDisplaySize(renderer);

    const canvas = renderer.domElement;
    uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
    uniforms.iTime.value = time;

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();