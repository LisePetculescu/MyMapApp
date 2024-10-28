// https://docs.expo.dev/tutorial/introduction/

import { View, StyleSheet } from "react-native";
import ImageViewer from "@/components/ImageViewer";
import Button from "@/components/Button";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";


const PlaceholderImage = require("@/assets/images/background-image.png");

export default function Index() {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });
    /* 
    The *******launchImageLibraryAsync()******* receives an object to specify 
    different options. This object is the ImagePickerOptions object, 
    which we are passing when invoking the method.

    When *******allowsEditing******* is set to true, the user can crop 
    the image during the selection process on Android and iOS.

    */
    if (!result.canceled) {
      console.log(result);
      setSelectedImage(result.assets[0].uri);
    } else {
      // console.error("no image chosen");
      alert("You did not select any image.");
    }
  };
  return (
    <View style={styles.container}>
      
      <View style={styles.imageContainer}>
        {/* <MapDisplay /> */}
        {/* <Image source={PlaceholderImage} style={styles.image}/> */}
        {/* <ImageViewer imgSource={PlaceholderImage} /> */}
        <ImageViewer imgSource={PlaceholderImage} selectedImage={selectedImage} />
      </View>
      <View style={styles.footerContainer}>
        <Button theme="primary" label="Choose a photo" onPress={pickImageAsync} />
        <Button label="Use this photo" />
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
  text: {
    color: "#ff8f",
    fontWeight: "800",
    fontSize: 30,
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
  footerContainer: {
    flex: 1 / 3,
    alignItems: "center",
  },
});
