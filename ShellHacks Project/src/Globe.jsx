import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import StarBackground from "./Stars";
import "./App.css";

function Globe() {
  // Create bool state for Globe/Map
  const [showMap, setshowMap] = useState(false);
  const [scene, setScene] = useState(null);
  // Create a ref for the DOM element
  const mountRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // Set up the scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Append the renderer to the ref's current node
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    setScene(scene);
    // Load the Earth texture
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load("/1_earth_16k.jpg");

    // Create a sphere geometry and apply the texture
    const geometry = new THREE.SphereGeometry(4, 48, 48);
    const material = new THREE.MeshBasicMaterial({ map: earthTexture });
    const globe = new THREE.Mesh(geometry, material);

    scene.add(globe);
    camera.position.z = 10;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // Animate the globe
    function animate() {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.0015; // Rotate the globe
      renderer.render(scene, camera);
    }

    animate();

    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [showMap]);

  // Load Map
  useEffect(() => {
    if (!showMap) return;

    const loadGoogleMaps = () => {
      // Check if the script is already added
      if (!document.querySelector("script[src*='maps.googleapis.com']")) {
        // Create a new script element
        const script = document.createElement("script");

        // Input API KEY
        script.src = `https://maps.googleapis.com/maps/api/js?key=&libraries=places,geometry&callback=initMap`;
        script.async = true;

        // Define the callback function
        window.initMap = () => {
          const map = new google.maps.Map(mapRef.current, {
            center: { lat: 0, lng: 0 },
            zoom: 2,
            disableDefaultUI: true,
            mapTypeId: "roadmap",
          });

          // Initialize the PlacesService
          const service = new google.maps.places.PlacesService(map);

          // Variable to store the current marker
          let currentMarker = null;

          // Function to find nearby charities based on location
          const findCharities = (location) => {
            console.log("Finding charities near:", location);
            const request = {
              location: new google.maps.LatLng(location.lat(), location.lng()),
              radius: "10000",
              keyword: "charity donation", // Use keyword for searching charities
            };

            service.nearbySearch(request, (results, status) => {
              console.log("Nearby search status:", status); // Debugging status
              if (status === google.maps.places.PlacesServiceStatus.OK) {
                let closestCharity = null;
                let minDistance = Infinity;

                // Iterate through each result to find the closest one
                results.forEach((place) => {
                  const distance =
                    google.maps.geometry.spherical.computeDistanceBetween(
                      location,
                      place.geometry.location
                    );

                  // Update the closest charity if this one is closer
                  if (distance < minDistance) {
                    minDistance = distance;
                    closestCharity = place;
                  }
                });

                console.log("Closest charity:", closestCharity);

                // Center the map on the closest charity's location
                if (closestCharity) {
                  map.setCenter(closestCharity.geometry.location);
                  map.setZoom(14); // Optional: Set a closer zoom level

                  // Remove the previous marker from the map
                  if (currentMarker) {
                    console.log("Removing marker:", currentMarker);
                    currentMarker.setMap(null);
                  }

                  // Add a marker for the closest charity
                  console.log(
                    "Adding new marker:",
                    closestCharity.geometry.location
                  );
                  currentMarker = new google.maps.Marker({
                    position: closestCharity.geometry.location,
                    map: map,
                    title: closestCharity.name,
                  });
                }
              }
            });
          };

          // Add click event listener to the map
          map.addListener("click", (e) => {
            const clickedLocation = e.latLng; // Get the clicked location
            console.log("Map clicked at: ", clickedLocation);
            // Call findCharities with clicked location
            findCharities(clickedLocation);
          });
        };

        // Append the script to the document head
        document.head.appendChild(script);
      } else {
        // If the script is already loaded, initialize the map directly
        window.initMap();
      }
    };

    loadGoogleMaps();
  }, [showMap]);

  return (
    <>
      {!showMap ? (
        <div
          ref={mountRef}
          className="scene-container"
          onClick={() => {
            setshowMap((prevState) => !prevState);
          }}
        >
          {" "}
          {scene && <StarBackground scene={scene} />}
        </div>
      ) : (
        <div ref={mapRef} className="earth-map"></div>
      )}
    </>
  );
}

export default Globe;
