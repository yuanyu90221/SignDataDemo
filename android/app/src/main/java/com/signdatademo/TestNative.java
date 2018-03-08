package com.signdatademo;

import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

import android.util.*;
import android.widget.Toast;

public class TestNative extends ReactContextBaseJavaModule {
  
  public TestNative(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName(){
    return "TestNative";
  }

  @ReactMethod
  public void test(String message, Callback cb) {
    try {
      android.util.Log.d("test","log");
      // Context ctx = new Context();
      cb.invoke("Native call back with message " + message);
      return;
    }
    catch(Exception e) {
      android.util.Log.d("", e.getMessage());
      e.printStackTrace();
    }
  }
}