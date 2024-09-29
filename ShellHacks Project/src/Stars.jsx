import React, { useEffect, useRef } from "react";
import * as THREE from "three";

function StarBackground({ scene }) {
  const domeRef = useRef();

  useEffect(() => {
    // Load the background texture (your star image)
    const textureLoader = new THREE.TextureLoader();
    const starTexture = textureLoader.load("/Star.jpg"); // Path to the image

    // Create a large sphere geometry
    const starGeometry = new THREE.SphereGeometry(50, 64, 64); // Adjust size and segments
    const starMaterial = new THREE.MeshBasicMaterial({
      map: starTexture,
      side: THREE.BackSide, // Render the texture on the inside of the sphere
    });

    // Create the star dome mesh
    const starDome = new THREE.Mesh(starGeometry, starMaterial);
    domeRef.current = starDome;

    // Add the dome to the scene
    scene.add(starDome);

    // Animation loop to rotate the dome
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate the dome slowly around its Y-axis
      starDome.rotation.y += 0.0005; // Adjust speed as desired
    };

    animate();

    // Cleanup function to remove the dome when the component is unmounted
    return () => {
      scene.remove(starDome);
      starDome.geometry.dispose();
      starDome.material.dispose();
    };
  }, [scene]);

  return null; // This component doesn't render anything directly
}

export default StarBackground;
