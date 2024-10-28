import { View, StyleSheet, Image, TouchableOpacity, Text, Pressable } from "react-native";
import ImageViewer from "@/components/ImageViewer";
import Button from "@/components/Button";
import * as ImagePicker from "expo-image-picker";

interface ImagePickingProps {
  selectedImage: string | undefined;
  setSelectedImage: (image: string | undefined) => void;
  onClose: () => void;
}

export default function ImagePicking({ selectedImage, setSelectedImage, onClose }: ImagePickingProps) {
  console.log("picker");

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      console.log("Image selected:", result.assets[0].uri);
      setSelectedImage(result.assets[0].uri);
      onClose();
    } else {
      alert("You did not select any image.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Close Button */}
      <Pressable onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </Pressable>

      <View style={styles.imageContainer}>
        <Image source={{ uri: selectedImage }} style={styles.image} />
      </View>
      <View style={styles.footerContainer}>
        <Button label="Choose a photo" onPress={pickImageAsync} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(150, 150, 150, 0.8)",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#25292e",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 200,
    borderRadius: 18,
  },
});

// import { View, StyleSheet } from "react-native";
// import ImageViewer from "@/components/ImageViewer";
// import Button from "@/components/Button";
// import * as ImagePicker from "expo-image-picker";
// import { useState } from "react";

// const PlaceholderImage = require("@/assets/images/background-image.png");

// export default function ImagePicking() {
//       const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
//   const pickImageAsync = async () => {
//     let result = await ImagePicker.launchImageLibraryAsync({
//       allowsEditing: true,
//       quality: 1,
//     });
//     if (!result.canceled) {
//       console.log(result);
//       setSelectedImage(result.assets[0].uri);
//     } else {
//       // console.error("no image chosen");
//       alert("You did not select any image.");
//     }
//   };

//     return (
//       <View style={styles.container}>
//         <View style={styles.imageContainer}>
//           <ImageViewer imgSource={PlaceholderImage} selectedImage={selectedImage} />
//         </View>
//         <View style={styles.footerContainer}>
//           {/* <Button theme="primary" label="Choose a photo" onPress={pickImageAsync} /> */}
//           <Button label="Use this photo" onPress={upload} />
//         </View>
//       </View>
//     );

// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#25292e",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   text: {
//     color: "#ff8f",
//     fontWeight: "800",
//     fontSize: 30,
//   },
//   button: {
//     fontSize: 20,
//     textDecorationLine: "underline",
//     color: "#f8ff",
//   },
//   imageContainer: {
//     flex: 1,
//   },
//   image: {
//     width: 320,
//     height: 440,
//     borderRadius: 18,
//   },
//   footerContainer: {
//     flex: 1 / 3,
//     alignItems: "center",
//   },
// });
