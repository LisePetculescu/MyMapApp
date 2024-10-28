import React, { useRef, useState, useEffect } from "react";
import { View, Alert, StyleSheet, Image } from "react-native";
import MapView, { Marker, Region, LongPressEvent } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes } from "firebase/storage";
import { storage } from "@/firebaseConfig.js"; 
import testFirebaseStorage from "./test";

type MarkerType = {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  key: number;
  title: string;
  imageUri?: string;
};


export default function Map() {
  // testFirebaseStorage();
  
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [region, setRegion] = useState<Region>({
    latitude: 55,
    longitude: 12,
    latitudeDelta: 20,
    longitudeDelta: 20,
  });
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [currentMarkerKey, setCurrentMarkerKey] = useState<number | null>(null); // To track the current marker

  const mapView = useRef<MapView | null>(null); // ref. to map obj.
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    startListening();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  async function startListening() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("no access to location");
      return;
    }
    locationSubscription.current = await Location.watchPositionAsync(
      {
        distanceInterval: 100, // 100 meters
        accuracy: Location.Accuracy.High,
      },
      (location) => {
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 20,
          longitudeDelta: 20,
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
      imageUri: undefined,
    };
    setMarkers([...markers, newMarker]);
    setCurrentMarkerKey(newMarker.key);
    await pickImageAsync(newMarker.key);
  };

  const pickImageAsync = async (markerKey: number) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      console.log("Image selected:", result.assets[0].uri);
      const imageUri = result.assets[0].uri;
      setSelectedImage(imageUri);
      await uploadImage(imageUri); // Call upload function here

      // Update the marker with the selected image URI
      setMarkers((prevMarkers) => prevMarkers.map((marker) => (marker.key === markerKey ? { ...marker, imageUri } : marker)));
    } else {
      Alert.alert("You did not select any image.");
    }
  };

  const uploadImage = async (uri: string) => {
    console.log("UPLOAD");

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `images/${Date.now()}.jpg`); // Create a reference to the file you want to upload
      await uploadBytes(storageRef, blob); // Upload the blob to Firebase Storage
      Alert.alert("Image uploaded successfully!");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error uploading image: ", error);
        Alert.alert("Error uploading image: ", error.message);
      } else {
        console.error("Unexpected error: ", error);
        Alert.alert("Unexpected error occurred.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} onLongPress={addMarker}>
        {markers.map((marker) => (
          <Marker coordinate={marker.coordinate} key={marker.key} title={marker.title}>
            {marker.imageUri && (
              <Image
                source={{ uri: marker.imageUri }}
                style={{ width: 50, height: 50, borderRadius: 25 }} // Small version of the image
              />
            )}
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

// import React, { useRef, useState, useEffect } from "react";
// import MapView, { Marker, LongPressEvent, Region } from "react-native-maps";
// import { StyleSheet, View, Alert } from "react-native";
// import * as Location from "expo-location";
// import * as ImagePicker from "expo-image-picker";

// import { app, firestore, storage } from "@/firebaseConfig.js";
// import { collection, addDoc } from "firebase/firestore";
// import { ref, uploadBytes } from "firebase/storage";
// import { Image } from "expo-image";

// type MarkerType = {
//   coordinate: {
//     latitude: number;
//     longitude: number;
//   };
//   key: number;
//   title: string;
//   imageUri?: string;
// };

// export default function Map() {
//   const [markers, setMarkers] = useState<MarkerType[]>([]);
//   const [region, setRegion] = useState<Region>({
//     latitude: 55,
//     longitude: 12,
//     latitudeDelta: 20,
//     longitudeDelta: 20,
//   });
//   const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
//   const [showImagePicker, setShowImagePicker] = useState(false);
//   const [currentMarkerKey, setCurrentMarkerKey] = useState<number | null>(null); // To track the current marker

//   // useRef rerenderer IKKE når man ændrer value, men gemmer stadig value
//   const mapView = useRef<MapView | null>(null); // ref. to map obj.
//   const locationSubscription = useRef<Location.LocationSubscription | null>(null);

//   useEffect(() => {
//     startListening();
//     return () => {
//       if (locationSubscription.current) {
//         locationSubscription.current.remove();
//       }
//     };
//   }, []);

//   async function startListening() {
//     let { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== "granted") {
//       alert("no acess to location");
//       return;
//     }
//     locationSubscription.current = await Location.watchPositionAsync(
//       {
//         distanceInterval: 100, // 100 meters
//         accuracy: Location.Accuracy.High,
//       },
//       (location) => {
//         const newRegion = {
//           latitude: location.coords.latitude,
//           longitude: location.coords.longitude,
//           latitudeDelta: 20,
//           longitudeDelta: 20,
//         };
//         setRegion(newRegion); // opdates the map with the new location
//         if (mapView.current) {
//           mapView.current.animateToRegion(newRegion);
//         }
//       }
//     );
//   }

//   const addMarker = async (event: LongPressEvent) => {
//     const { latitude, longitude } = event.nativeEvent.coordinate;
//     const newMarker = {
//       coordinate: { latitude, longitude },
//       key: Date.now(),
//       title: "New Marker",
//       imageUri: undefined,
//     };
//     setMarkers([...markers, newMarker]);
//     setCurrentMarkerKey(newMarker.key);
//     await pickImageAsync();
//   };

//  const pickImageAsync = async () => {
//    let result = await ImagePicker.launchImageLibraryAsync({
//      allowsEditing: true,
//      quality: 1,
//    });
//    /*
//     The *******launchImageLibraryAsync()******* receives an object to specify
//     different options. This object is the ImagePickerOptions object,
//     which we are passing when invoking the method.

//     When *******allowsEditing******* is set to true, the user can crop
//     the image during the selection process on Android and iOS.

//     */
//    if (!result.canceled) {
//      console.log("Image selected:", result.assets[0].uri);
//      const imageUri = result.assets[0].uri;
//      setSelectedImage(imageUri);
//      await uploadImage(imageUri); // Call upload function here
//    } else {
//      Alert.alert("You did not select any image.");
//    }
//  };

//   const uploadImage = async (uri: string) => {
//     try {
//       const response = await fetch(uri);
//       const blob = await response.blob();

//       const storageRef = ref(storage, `images/${Date.now()}.jpg`); // Create a reference to the file you want to upload
//       await uploadBytes(storageRef, blob); // Upload the blob to Firebase Storage
//       Alert.alert("Image uploaded successfully!");
//     } catch (error) {
//       if (error instanceof Error) {
//         console.error("Error uploading image: ", error);
//         Alert.alert("Error uploading image: ", error.message);
//       } else {
//         console.error("Unexpected error: ", error);
//         Alert.alert("Unexpected error occurred.");
//       }
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <MapView style={styles.map} region={region} onLongPress={addMarker}>
//         {markers.map((marker) => (
//           <Marker coordinate={marker.coordinate} key={marker.key} title={marker.title} />
//         ))}
//       </MapView>
//     </View>
//   );
// }

// import React, { useRef, useState, useEffect } from "react";
// import MapView, { Marker, LongPressEvent, Region } from "react-native-maps";
// import { StyleSheet, View } from "react-native";
// import * as Location from "expo-location";
// import ImageViewer from "@/components/ImageViewer";
// import Button from "@/components/Button";
// import * as ImagePicker from "expo-image-picker";
// import { app, firestore, storage } from "@/firebaseConfig.js";
// import { collection, addDoc } from "firebase/firestore";
// import { ref, uploadBytes } from "firebase/storage";

// type MarkerType = {
//   coordinate: {
//     latitude: number;
//     longitude: number;
//   };
//   key: number;
//   title: string;
// };

// export default function map() {
//   const [markers, setMarkers] = useState<MarkerType[]>([]);
//   const [region, setRegion] = useState<Region>({
//     latitude: 55,
//     longitude: 12,
//     latitudeDelta: 20,
//     longitudeDelta: 20,
//   });
//   const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
//   const pickImageAsync = async () => {
//     let result = await ImagePicker.launchImageLibraryAsync({
//       allowsEditing: true,
//       quality: 1,
//     });

//     if (!result.canceled) {
//       console.log(result);
//       setSelectedImage(result.assets[0].uri);
//     } else {
//       alert("You did not select any image.");
//     }
//   };
//   const PlaceholderImage = require("@/assets/images/background-image.png");

//   async function uploadImage() {
//     if (!selectedImage) {
//       alert("No image selected");
//       return;
//     }

//     try {
//       const res = await fetch(selectedImage);
//       const blob = await res.blob();
//       const storageRef = ref(storage, "myImage.jpg");
//       await uploadBytes(storageRef, blob);
//       alert("Image uploaded");
//     } catch (error) {
//       console.error("Error uploading image:", error);
//       alert("Failed to upload image");
//     }
//   }

//   // useRef rerenderer IKKE når man ændrer value, men gemmer stadig value
//   const mapView = useRef<MapView | null>(null); // ref. to map obj.
//   const locationSubscription = useRef<Location.LocationSubscription | null>(null);

//   useEffect(() => {
//     startListening();
//     return () => {
//       if (locationSubscription.current) {
//         locationSubscription.current.remove();
//       }
//     };
//   }, []);

//   async function startListening() {
//     let { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== "granted") {
//       alert("no acess to location");
//       return;
//     }
//     locationSubscription.current = await Location.watchPositionAsync(
//       {
//         distanceInterval: 100, // 100 meters
//         accuracy: Location.Accuracy.High,
//       },
//       (location) => {
//         const newRegion = {
//           latitude: location.coords.latitude,
//           longitude: location.coords.longitude,
//           latitudeDelta: 20,
//           longitudeDelta: 20,
//         };
//         setRegion(newRegion); // opdates the map with the new location
//         if (mapView.current) {
//           mapView.current.animateToRegion(newRegion);
//         }
//       }
//     );
//   }

//   function addMarker(event: LongPressEvent) {
//     console.log("longpress marker add");

//     const { latitude, longitude } = event.nativeEvent.coordinate;
//     const newMarker = {
//       coordinate: { latitude, longitude },
//       key: event.timeStamp,
//       title: "Adding a picture...",
//     };
//     setMarkers([...markers, newMarker]);

//   }

//   function onMarkerPressed(text: string) {
//     alert(`You pressed ` + text);
//   }

//   async function handleSave() {
//     await addDoc(collection(firestore, "selectedImage"), {});
//   }

//   return (
//     <View style={styles.container}>
//       <MapView style={styles.map} region={region} onLongPress={addMarker}>
//         {markers.map((marker) => (
//           <Marker coordinate={marker.coordinate} key={marker.key} title={marker.title} onPress={pickImageAsync} />
//           // <Marker coordinate={marker.coordinate} key={marker.key} title={marker.title} onPress={() => onMarkerPressed(marker.title)} />
//         ))}
//       </MapView>
//       <View>
//         <ImageViewer imgSource={PlaceholderImage} selectedImage={selectedImage} />
//       </View>
//     </View>
//   );
// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  button: {
    fontSize: 20,
    textDecorationLine: "underline",
    color: "#f8ff",
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: 320,
    height: 440,
    borderRadius: 18,
  },
});
