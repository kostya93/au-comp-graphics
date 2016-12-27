precision highp float;

uniform sampler2D diffuseMap;
uniform sampler2D normalMap;
uniform sampler2D depthMap;

varying vec3 v_fragPos;
varying vec2 v_texCoord;
varying vec3 v_tangentLight;
varying vec3 v_tangentViewPos;
varying vec3 v_tangentFragPos;

vec2 parallaxMapping(vec2 texCoords, vec3 viewDir)
{
	const float minLayers = 10.0;
	const float maxLayers = 20.0;
	float numLayers = mix(maxLayers, minLayers, abs(dot(vec3(0.0, 0.0, 1.0), viewDir)));

	float layerDepth = 1.0 / numLayers;
	float currentLayerDepth = 0.0;
	vec2 P = viewDir.xy / viewDir.z * 0.05;
	vec2 deltaTexCoords = P / numLayers;

	vec2 currentTexCoords = texCoords;
	float depth = texture2D(depthMap, currentTexCoords).r;

	for (int i = 0; i < 100; i++) {
	    if (currentLayerDepth >= depth) {
	        break;
	    }
	    currentTexCoords -= deltaTexCoords;
        depth = texture2D(depthMap, currentTexCoords).r;
        currentLayerDepth += layerDepth;
	}

	vec2 prevTexCoords = currentTexCoords + deltaTexCoords;

	float afterDepth  = depth - currentLayerDepth;
	float beforeDepth = texture2D(depthMap, prevTexCoords).r - currentLayerDepth + layerDepth;

	float weight = afterDepth / (afterDepth - beforeDepth);
	vec2 finalTexCoords = prevTexCoords * weight + currentTexCoords * (1.0 - weight);

	return finalTexCoords;
}

void main()
{
	vec3 viewDir = normalize(v_tangentViewPos - v_tangentFragPos);
	vec2 texCoords = parallaxMapping(v_texCoord, viewDir);

	if (texCoords.x > 1.0 || texCoords.y > 1.0 || texCoords.x < 0.0 || texCoords.y < 0.0)
		discard;

	vec3 color = texture2D(diffuseMap, texCoords).rgb;
	vec3 ambient = 0.1 * color;

	vec3 lightDir = normalize(v_tangentLight - v_tangentFragPos);
	vec3 normal = normalize(texture2D(normalMap, texCoords).rgb * 2.0 - 1.0);
	vec3 diffuse = color * max(dot(lightDir, normal), 0.0);

	vec3 reflectDir = reflect(-lightDir, normal);
	vec3 halfwayDir = normalize(lightDir + viewDir);
	vec3 specular = vec3(0.2) * pow(max(dot(normal, halfwayDir), 0.0), 32.0);

	gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

