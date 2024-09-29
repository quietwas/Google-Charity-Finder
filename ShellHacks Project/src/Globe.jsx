import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import axios from "axios"; // Import axios
import StarBackground from "./Stars";
import ChatbotModal from "./ChatbotModal";
import "./App.css";

function Globe() {
  const [showMap, setshowMap] = useState(false);
  const [scene, setScene] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCharity, setSelectedCharity] = useState(null);
  const mountRef = useRef(null);
  const mapRef = useRef(null);

  // Initialize 3D globe
  useEffect(() => {
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

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    setScene(scene);
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load("/1_earth_16k.jpg");

    const geometry = new THREE.SphereGeometry(4, 48, 48);
    const material = new THREE.MeshBasicMaterial({ map: earthTexture });
    const globe = new THREE.Mesh(geometry, material);

    scene.add(globe);
    camera.position.z = 10;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    function animate() {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.0015;
      renderer.render(scene, camera);
    }

    animate();

    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [showMap]);

  // Load Google Maps script and initialize map
  useEffect(() => {
    if (!showMap) return;

    const loadGoogleMaps = () => {
      if (!document.querySelector("script[src*='maps.googleapis.com']")) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${
          import.meta.env.VITE_GOOGLE_MAP_GEN_KEY
        }&libraries=places,geometry&callback=initMap`;
        script.async = true;

        window.initMap = () => {
          const map = new google.maps.Map(mapRef.current, {
            center: { lat: 0, lng: 0 },
            zoom: 2,
          });

          let currentMarker = null;

          const findCharities = async (location) => {
            try {
              // Make a request to your Express proxy server
              const response = await axios.get(
                "http://localhost:5000/api/maps",
                {
                  params: {
                    location: `${location.lat()},${location.lng()}`, // Lat/lng from Google Maps click event
                    radius: "20000",
                    keyword: "charity donation",
                  },
                }
              );

              const results = response.data.results;

              let closestCharity = null;
              let minDistance = Infinity;

              results.forEach((place) => {
                const distance =
                  google.maps.geometry.spherical.computeDistanceBetween(
                    location,
                    new google.maps.LatLng(
                      place.geometry.location.lat,
                      place.geometry.location.lng
                    )
                  );

                if (distance < minDistance) {
                  minDistance = distance;
                  closestCharity = place;
                }
              });

              if (closestCharity) {
                // Center map to closest charity
                map.setCenter(
                  new google.maps.LatLng(
                    closestCharity.geometry.location.lat,
                    closestCharity.geometry.location.lng
                  )
                );
                map.setZoom(14);

                // Remove previous marker if exists
                if (currentMarker) {
                  currentMarker.setMap(null);
                }

                // Add a new marker for the closest charity
                currentMarker = new google.maps.Marker({
                  position: new google.maps.LatLng(
                    closestCharity.geometry.location.lat,
                    closestCharity.geometry.location.lng
                  ),
                  map: map,
                  title: closestCharity.name,
                });

                // Set the selected charity with all necessary details
                setSelectedCharity(closestCharity.name);
                setIsModalOpen(true);
              }
            } catch (error) {
              console.error("Error fetching charities:", error);
            }
          };

          map.addListener("click", (e) => {
            const clickedLocation = e.latLng;
            findCharities(clickedLocation); // Fetch nearby charities on map click
          });
        };

        document.head.appendChild(script);
      } else {
        window.initMap();
      }
    };

    loadGoogleMaps();
  }, [showMap]); // Correct placement of useEffect

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
          {scene && <StarBackground scene={scene} />}
        </div>
      ) : (
        <div
          ref={mapRef}
          style={{ width: "100vw", height: "100vh" }}
          className="earth-map"
        ></div>
      )}
      <ChatbotModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        charityName={selectedCharity}
      />
    </>
  );
}

export default Globe;
