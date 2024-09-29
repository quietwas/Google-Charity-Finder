import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
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

  useEffect(() => {
    if (!showMap) return;

    const loadGoogleMaps = () => {
      if (!document.querySelector("script[src*='maps.googleapis.com']")) {
        const script = document.createElement("script");
        script.src = "https://maps.googleapis.com/maps/api/js?key=&libraries=places,geometry&callback=initMap";
        script.async = true;

        window.initMap = () => {
          const map = new google.maps.Map(mapRef.current, {
            center: { lat: 0, lng: 0 },
            zoom: 2,
          });

          const service = new google.maps.places.PlacesService(map);
          let currentMarker = null;

          const findCharities = (location) => {
            const request = {
              location: new google.maps.LatLng(location.lat(), location.lng()),
              radius: "5000",
              keyword: "charity donation",
            };

            service.nearbySearch(request, (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK) {
                let closestCharity = null;
                let minDistance = Infinity;

                results.forEach((place) => {
                  const distance = google.maps.geometry.spherical.computeDistanceBetween(
                    location,
                    place.geometry.location
                  );

                  if (distance < minDistance) {
                    minDistance = distance;
                    closestCharity = place;
                  }
                });

                if (closestCharity) {
                  map.setCenter(closestCharity.geometry.location);
                  map.setZoom(14);

                  if (currentMarker) {
                    currentMarker.setMap(null);
                  }

                  currentMarker = new google.maps.Marker({
                    position: closestCharity.geometry.location,
                    map: map,
                    title: closestCharity.name,
                  });

                  setSelectedCharity(closestCharity.name);
                  setIsModalOpen(true);
                }
              }
            });
          };

          map.addListener("click", (e) => {
            const clickedLocation = e.latLng;
            findCharities(clickedLocation);
          });
        };

        document.head.appendChild(script);
      } else {
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
