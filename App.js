/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */
import RNFS from 'react-native-fs';
import uuid from './uuid';
import React, { Component } from 'react';
import { Slider, Platform, StyleSheet, NativeModules, NativeEventEmitter, NativeAppEventEmitter, TouchableHighlight, Text, View } from 'react-native';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' + 'Shake or press menu button for dev menu'
});

async function requestRecordPermission() {
    try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                                                         { 'title': 'Native Recorder Permission',
                                                           'message': 'Native Recorder requires record permission.'});
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Got Record Permission');
        } else {
            console.log('Denied Record Permission');
        }
    } catch (err) {
        console.warn(err);
    }
}

async function requestStoragePermission() {
    try {
        const read_granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                                                         { 'title': 'Native Recorder Permission',
                                                           'message': 'Native Recorder requires storage permission.'});
        if (read_granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Got Read Storage Permission');
        } else {
            console.log('Denied Read Storage Permission');
        }

        const write_granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                                                               { 'title': 'Native Recorder Permission',
                                                                 'message': 'Native Recorder requires storage permission.'});
        if (write_granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Got Write Storage Permission');
        } else {
            console.log('Denied Write Storage Permission');
        }
    } catch (err) {
        console.warn(err);
    }
}

requestRecordPermission();
requestStoragePermission();

type Props = {};
const AudioEngine = NativeModules.AudioEngine;

//const AudioEventEmitter = new NativeEventEmitter(AudioEngine);

export default class App extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      filename: uuid() + '.wav',
      recording: false,
      currentTime: 0.0,
      p: 0,
      currentState: 'STATE_INIT'
    };
    AudioEngine.setInputGain(3);

    // if (Platform.OS === 'android') {
    positionChange = NativeAppEventEmitter.addListener('audioPositionChanged', ev => {
      //console.log('audioPositionChanged: ' + ev.position + ' Duration: ' + ev.duration);
      this.updatePosition(ev.position, ev.duration);
    });
    stateChange = NativeAppEventEmitter.addListener('audioStateChanged', ev => {
      console.warn(`audioStateChanged: ${ev.state}`);
      this.updateState(ev.state);
    });
    // } else {
    // const AudioEventEmitter = new NativeEventEmitter(AudioEngine);
    // positionChange = AudioEventEmitter.addListener('audioPositionChanged', ev => {
    //   console.log('ios audioPositionChanged: ' + ev.position + ' Duration: ' + ev.duration);
    //   this.updatePosition(ev.position, ev.duration);
    // });
    // stateChange = AudioEventEmitter.addListener('audioStateChanged', ev => {
    //   console.log('audioStateChanged: ' + ev.state);
    //   this.updateState(ev.state);
    // });
    // }
    AudioEngine.open(RNFS.DocumentDirectoryPath + '/' + this.state.filename)
      .then(result => console.warn('AudioEngine::open ' + result))
      .catch(error => console.warn('AudioEngine::open error ' + error));
  }
  updatePosition(position, duration) {
    console.log('updatePosition ' + position + ' Duration: ' + duration);
    this.setState({ currentTime: Math.floor(position), p: position });
  }
  updateState(state) {
    console.log('updating state to ' + state);
    this.setState({ currentState: state });
  }
  renderButton(title, onPress, active) {
    var style = active ? styles.activeButtonText : styles.buttonText;

    return (
      <TouchableHighlight style={styles.button} onPress={onPress}>
        <Text style={style}>{title}</Text>
      </TouchableHighlight>
    );
  }
  seek(p) {
    console.log('seeking% = ' + p);
    AudioEngine.setPosition(p);
    this.setState({ currentTime: p });
  }

  render() {
    let recordBtn;
    let playBtn;
    if (this.state.currentState === 'STATE_RECORD') {
      recordBtn = this.renderButton('STOP', () => {
        console.log('stop record button pushed');
        console.log(this.state.p);
        AudioEngine.stop();
      });
    } else {
      recordBtn = this.renderButton('RECORD', () => {
        console.log('record button pushed');
        console.log(this.state.p);
        AudioEngine.record();
      });
    }
    if (this.state.currentState === 'STATE_PLAY') {
      playBtn = this.renderButton('STOP', () => {
        console.log('stop play button pushed');
        console.log(this.state.p);
        AudioEngine.stop();
      });
    } else {
      playBtn = this.renderButton('PLAY', () => {
        console.log('play button pushed');
        console.log(this.state.p);
        AudioEngine.play();
      });
    }
    return (
      <View style={styles.container}>
        <View style={styles.controls}>
          {recordBtn}
          <Slider onValueChange={p => this.seek(p)} value={this.state.currentTime} minimumValue={0} maximumValue={100} step={1} style={styles.slider} />
          <Text style={styles.progressText}>{this.state.currentTime}s</Text>
          {playBtn}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  controls: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column'
  },
  progressText: {
    paddingTop: 50,
    fontSize: 50
  },
  slider: {
    width: '90%'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5
  }
});
