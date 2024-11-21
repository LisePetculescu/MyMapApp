import React, { useRef, useState, useEffect } from "react";
import { View, Alert, StyleSheet, Image } from "react-native";
import MapView, { Marker, Region, LongPressEvent } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, firestore } from "@/firebaseConfig.js";
import Button from "@/components/Button";
import * as ImageManipulator from "expo-image-manipulator";
import { collection, doc, addDoc, updateDoc, onSnapshot } from "firebase/firestore";

interface MarkerType {
  id?: string | undefined;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  key: number;
  title: string;
  imageUri?: string;
  imagepath?: string;
}

export default function Map() {
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [region, setRegion] = useState<Region>({
    latitude: 55,
    longitude: 12,
    latitudeDelta: 20,
    longitudeDelta: 20
  }); // these numbers makes the map show DK as a starting point

  const mapView = useRef<MapView | null>(null); // ref. to map obj.
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [currentImage, setCurrentImage] = useState<string | undefined>(undefined);
  const [currentMarkerId, setCurrentMarkerId] = useState<string | undefined>(undefined); // To track the current marker

  useEffect(() => {
    startListening();
    const unSubFetch = fetchMarkers();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (unSubFetch) {
        unSubFetch();
      }
    };
  }, []);
  // useEffect(() => {
  //   const start = async () => {
  //     await startListening();
  //     const unSubFetch = await fetchMarkers();
  //     return () => {
  //       if (locationSubscription.current) {
  //         locationSubscription.current.remove();
  //       }
  //       if (unSubFetch) {
  //         unSubFetch();
  //       }
  //     };
  //   };
  //   start();
  // }, []);

  // get collection data
  function fetchMarkers() {
    try {
      // const querySnapshot = await getDocs(collection(firestore, "markers"));
      const unSub = onSnapshot(collection(firestore, "markers"), (collData) => {
        const fetchedMarkers: MarkerType[] = [];
        collData.forEach((doc) => {
          const data = doc.data();
          fetchedMarkers.push({
            coordinate: { latitude: data.latitude, longitude: data.longitude },
            key: data.key,
            title: data.title,
            imageUri: data.imageUri,
            id: doc.id
          });
        });
        setMarkers(fetchedMarkers);
        console.log("fetchedMarkers");
        // console.log("markers fetched: ", fetchedMarkers);
      });
      return unSub;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching markers:", error.message);
        Alert.alert("Error fetching markers", error.message);
      } else {
        console.error("Unexpected error:", error);
        Alert.alert("Unexpected error occurred.");
      }
    }
  }

  async function startListening() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("no access to location");
      return;
    }
    locationSubscription.current = await Location.watchPositionAsync(
      {
        distanceInterval: 100, // 100 meters
        accuracy: Location.Accuracy.High
      },
      (location) => {
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 20,
          longitudeDelta: 20
        };
        setRegion(newRegion); // updates the map with the new location
        if (mapView.current) {
          mapView.current.animateToRegion(newRegion);
        }
      }
    );
  }

  const addMarker = async (event: LongPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newMarker = {
      coordinate: { latitude, longitude },
      key: Date.now(),
      title: "New Marker",
      imageUri: undefined
    };

    handleSaveMarker(newMarker);
    // await pickImageAsync(newMarker);
  };

  const handleSaveMarker = async (newMarker: MarkerType) => {
    console.log("handle marker");

    if (newMarker) {
      try {
        // Prepare the data to save, checking for imageUri
        const markerData: { latitude: number; longitude: number; title: string; key: number; imageUri?: string } = {
          latitude: newMarker.coordinate.latitude,
          longitude: newMarker.coordinate.longitude,
          title: newMarker.title,
          key: newMarker.key
        };

        // Only add imageUri if it exists
        if (newMarker.imageUri) {
          markerData.imageUri = newMarker.imageUri; // Add imageUri if available
        }

        // Log the data being saved
        console.log("Data being saved:", markerData);

        // Save the marker data to Firestore
        const docRef = await addDoc(collection(firestore, "markers"), markerData);
        console.log("**********id er du der?********* : ", docRef);

        // set currentmarkerID
        setCurrentMarkerId(docRef.id);

        // call image picker with marker id
        // await pickImageAsync(docRef.id);
        await pickImageAsync();

        console.log("Marker saved to Firestore:", newMarker);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Marker saving error:", error.message);
          alert("Error saving marker: " + error.message);
        }
      }
    } else {
      alert("No marker found to save.");
    }
  };

  const pickImageAsync = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 1
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const imageUri: string = result.assets[0].uri; // Assert as string
        console.log("Image selected:", imageUri);

        // Optional: set selectedImage if needed elsewhere
        setSelectedImage(imageUri);
      } else {
        Alert.alert("You did not select any image.");
      }
    } catch (error) {
      console.error("Image selection error:", error);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage || currentMarkerId === null) {
      Alert.alert("No image selected or no current marker.");
      return;
    }

    try {
      console.log("Starting upload...");

      // Resize the image before uploading
      const manipulatedImage = await ImageManipulator.manipulateAsync(selectedImage, [{ resize: { width: 800 } }], { compress: 1, format: ImageManipulator.SaveFormat.JPEG });

      // Fetch the resized image as a blob
      const response = await fetch(manipulatedImage.uri);
      if (!response.ok) {
        throw new Error("Failed to fetch the image");
      }

      const blob = await response.blob(); // Create a blob directly from the response
      console.log("Blob created");

      const imageName = `images/${new Date().getTime()}.jpg`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, imageName);
      console.log("Storage ref created:", storageRef);

      await uploadBytes(storageRef, blob);
      console.log("Upload successful!");

      // Get the download URL of the uploaded image
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Download URL obtained:", downloadURL);

      // Update the marker in Firestore with the new image URL
      if (currentMarkerId) {
        // Create a reference to the specific marker document in Firestore
        const markerDocRef = doc(firestore, "markers", currentMarkerId);
        console.log("Markerdocref: ", markerDocRef);

        // Update the imageUri field for that marker document
        // await updateDoc(markerDocRef, { imageUri: downloadURL });
        await updateDoc(markerDocRef, { imageUri: downloadURL, imagePath: imageName });
        console.log("Marker updated in Firestore with new image URL:", downloadURL);
        console.log("Current marker ID: ", currentMarkerId);
      }

      Alert.alert("Image uploaded successfully!");

      if (currentImage) {
        deleteImage(currentImage);
      }
      // Optionally cancel image selection if needed
      cancelImageSelection();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Image upload error:", error.message);
        Alert.alert("Image upload error", error.message);
      } else {
        console.error("Unexpected error:", error);
        Alert.alert("Unexpected error occurred.");
      }
    }
  };

  function showImage(marker: MarkerType) {
    setCurrentImage(marker.imageUri);
    setCurrentMarkerId(marker.id);
  }

  function updateImage() {
    // delete old image when a new one is uploaded on a marker
    console.log("update image on marker");

    // vælg nyt billede
    pickImageAsync();

    // show newly picked image and upload button
  }

  function deleteImage(imageToDelete: string | undefined) {
    if (imageToDelete) {
      console.log("delete image: ", imageToDelete);

      const imageRef = ref(storage, imageToDelete);

      console.log("imageRef: ", imageRef);

      try {
        deleteObject(imageRef).then(() => Alert.alert("Old image deleted"));
        console.log("IMAGE DELETED!!!!!!!!!!!!!!!!!", imageRef);
      } catch {
        console.error("ERROR: couldn't delete old image");
      }
    } else {
      console.error("no image to delete");
    }
  }

  const cancelImageSelection = () => {
    setSelectedImage(undefined); // Reset selected image
    setCurrentImage(undefined);
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} onLongPress={addMarker}>
        {markers.map((marker) => (
          <Marker
            id={marker.id}
            coordinate={marker.coordinate}
            key={marker.id}
            title={marker.title}
            onPress={() => {
              if (marker.imageUri) {
                showImage(marker);
              } else {
                setCurrentMarkerId(marker.id);
                pickImageAsync();
              }
            }}
          >
            {/* {marker.imageUri && (
              <Image
                source={{ uri: marker.imageUri }}
                style={{ width: 50, height: 50, borderRadius: 25 }} // Small version of the image
              />
            )} */}
          </Marker>
        ))}
      </MapView>

      {currentImage && !selectedImage && (
        <View style={styles.overlay}>
          {/* Display existing image if no new image is selected */}
          <Image source={{ uri: currentImage }} style={{ width: 300, height: 300 }} />
          <Button label="Update Image" theme="select" onPress={updateImage} />
          <Button label="Cancel" theme="cancel" onPress={cancelImageSelection} />
        </View>
      )}

      {selectedImage && (
        <View style={styles.overlay}>
          {/* Display preview of new image for updating */}
          <Image source={{ uri: selectedImage }} style={{ width: 300, height: 300 }} />
          <Button label="Upload New Image" theme="select" onPress={uploadImage} />
          <Button label="Cancel" theme="cancel" onPress={cancelImageSelection} />
        </View>
      )}
    </View>
  );
}

console.log("hej");

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    width: "100%",
    height: "100%"
  },
  button: {
    fontSize: 20,
    textDecorationLine: "underline",
    color: "#f8ff"
  },
  imageContainer: {
    flex: 1
  },
  image: {
    width: 320,
    height: 440,
    borderRadius: 18
  },
  overlay: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 10
  }
});
