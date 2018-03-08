# SignDataDemo

## 1 purpose
  use to write an rn-native app to 

  deploy an smart contract on the 
  
  private node

## 2 special lib
  need to use rn-nodeify to hacker some randomByte library

  because react-native has its own special style form javascript

  this is done with first browserify origin lib and then replace require with reqq

## 3 link react-callback with android
  need to add Packe in getPackages method in android project:
  
```code
@Override
protected List<ReactPackage> getPackages() {
  return Arrays.<ReactPackage>asList(
      new MainReactPackage(),
      new TestPackage()
  );
}
```

and write the function call in react component

```code
<Button title="sendMessage" onPress={() => {
  NativeModules.TestNative.test("Echo", (str) => {
    Alert.alert(str);
  })
}}>
</Button>
```

## 4 install the project

```code
   $ npm install 
   $ npm install -S rn-nodeify
   $ ./node_modules/.bin/rn-nodeify --hack —install
```

## 5 run the project with Android studio VM

  1 first need to Start the Android VM

  2 run `react-native run-android` in the project folder 