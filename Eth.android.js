import React from 'react';
import { StyleSheet, Text, View, Alert, Button, NativeModules } from 'react-native'; 

export default class EtherComponent extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Button title="sendMessage" onPress={() => {
          NativeModules.TestNative.test("Echo", (str) => {
            Alert.alert(str);
          })
        }}>
        </Button>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    alignItems: 'center',
    justifyContent: 'center'
  }
})