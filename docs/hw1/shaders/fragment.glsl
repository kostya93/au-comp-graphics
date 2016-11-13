precision highp float;
uniform sampler2D spect;

uniform vec4 u_translation;
uniform vec4 u_scale;
uniform int max_iterations;

varying vec4 v_texCoord;
void main(void) {
  float clr = 0.0;

  float e = 4.0;
  const int MAX_ITER = 100;

  float x = v_texCoord.x*2.0;
  float y = v_texCoord.y*2.0;

  float rt = x;
  float it = y;

  float arg = x*x + y*y;

  int iter=0;

  for (int i=0; i <= MAX_ITER; i++) {
    iter=i;
    if (arg >= e || i >= max_iterations) {
      break;
    }
    float rt2 = rt*rt - it*it + x;
    it = 2.0*it*rt + y;
    rt = rt2;
    arg = rt*rt + it*it;
  }

  clr = float(iter)/float(max_iterations);

  vec4 color;

  if (iter == max_iterations) {
    color = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    color = texture2D(spect, vec2(clr, 0.0));
  }
  gl_FragColor = color;
}
