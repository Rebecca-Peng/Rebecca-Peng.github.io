function main() {
  const canvas = document.querySelector('#c1');
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


vec2 rotate2D(vec2 _st, float _angle){
   _st -= 0.5;
   _st =  mat2(cos(_angle),-sin(_angle),
               sin(_angle),cos(_angle)) * _st;
   _st += 0.5;
   return _st;
}

vec2 tile(vec2 _st, float _zoom){
   _st *= _zoom;
   return fract(_st);
}

float random(vec2 st){
   return fract(sin(dot(st.xy,vec2(12.9898,78.253))) * 43988.23545234);
}

float box(vec2 _st, vec2 _size, float _smoothEdges){
   _size = vec2(0.5)-_size*0.5;
   vec2 aa = vec2(_smoothEdges*0.5);
   vec2 uv = smoothstep(_size,_size+aa,_st);
   uv *= smoothstep(_size,_size+aa,vec2(1.0)-_st);
   return uv.x*uv.y;
}

float cross(in vec2 _st, float _size,float _smoothEdges){
   return  box(_st, vec2(_size,_size/4.),_smoothEdges) + box(_st, vec2(_size/4.,_size),_smoothEdges);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
   // Normalized pixel coordinates (from 0 to 1)
   vec2 uv = fragCoord/iResolution.xy;

   // Time varying pixel color
   vec3 col =  vec3(0.);
   uv = tile(uv,4.);
   float time = random(uv);
   uv =rotate2D(uv,3.14 * (sin(iTime) + cos(iTime)) * time * .2);
   
   float c = cross(uv,.8,.001);
   col = vec3(c) * vec3(0.551,0.990,0.019);
   
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