/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */
import RNFS from 'react-native-fs';
import uuid from './uuid';
import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  NativeModules,
  NativeEventEmitter,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' +
    'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

type Props = {};
const AudioEngine = NativeModules.AudioEngine;

const AudioEventEmitter = new NativeEventEmitter(AudioEngine);

export default class App extends Component<Props> {
  constructor(props) {
      super(props);
      this.state = {
          filename: uuid() + '.wav',
          recording: false,
          currentTime: 0.0,
          currentState:'STATE_INIT'

      };
      AudioEngine.setInputGain(3);

      const AudioEventEmitter = new NativeEventEmitter(AudioEngine);
      positionChange = AudioEventEmitter.addListener('audioPositionChanged', (ev) => {
          console.log('ios audioPositionChanged: ' + ev.position + ' Duration: ' + ev.duration);
          this.updatePosition(ev.position, ev.duration);
      });
      stateChange = AudioEventEmitter.addListener('audioStateChanged', (ev) => {
        console.log('audioStateChanged: ' + ev.state);
        this.updateState(ev.state);
      });
      AudioEngine.open(RNFS.DocumentDirectoryPath + '/' + this.state.filename)
        .then(result => console.log('AudioEngine::open ' + result))
        .catch(error => console.log('AudioEngine::open error ' + error));
  }
  updatePosition(position, duration) {
    console.log('updatePosition ' + position + ' Duration: ' + duration);
     this.setState({currentTime: Math.floor(duration)});
  }
  updateState(state){
    this.setState({currentState:state});
  }
  renderButton(title, onPress, active) {
    var style = (active) ? styles.activeButtonText : styles.buttonText;

    return (
      <TouchableHighlight style={styles.button} onPress={onPress}>
        <Text style={style}>
          {title}
        </Text>
      </TouchableHighlight>
    );
  }
  async record(){
    console.log("recording");
    if(this.state.currentState === 'STATE_RECORD'){
      //return;
    }
    AudioEngine.record();
  }
  async stop(){
    console.log("stop");
    AudioEngine.stop();
    console.log(this.state.currentState);
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.controls}>
          {this.renderButton("RECORD", () => {this.record()}, this.state.recording )}
          {this.renderButton("STOP", () => {this.stop()} )}
          <Text style={styles.progressText}>{this.state.currentTime}s</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controls: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  progressText: {
   paddingTop: 50,
   fontSize: 50,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
