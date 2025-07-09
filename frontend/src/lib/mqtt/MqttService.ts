import Paho from "paho-mqtt";

export type MqttStatus = "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "ERROR";
type MessageCallback = (payload: any) => void;
type StatusChangeCallback = (status: MqttStatus) => void;

export class MqttService {
  private static instance: MqttService;
  private client: Paho.Client;
  private status: MqttStatus = "DISCONNECTED";
  private subscriptions: Map<string, MessageCallback[]> = new Map();
  private statusChangeCallbacks: StatusChangeCallback[] = [];
  private isConnecting = false;

  private constructor(host: string, port: number, clientId: string) {
    this.client = new Paho.Client(host, port, clientId);
    this.client.onConnectionLost = this.onConnectionLost.bind(this);
    this.client.onMessageArrived = this.onMessageArrived.bind(this);
  }

  public static getInstance(
    host: string,
    port: number,
    clientId: string,
  ): MqttService {
    if (!MqttService.instance) {
      MqttService.instance = new MqttService(host, port, clientId);
    }
    return MqttService.instance;
  }

  private setStatus(newStatus: MqttStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    console.log(`MQTT Status: ${newStatus}`);
    this.statusChangeCallbacks.forEach((cb) => cb(this.status));
  }

  public connect() {
    if (this.status === "CONNECTED" || this.isConnecting) {
      return;
    }

    try {
      this.isConnecting = true;
      this.setStatus("CONNECTING");
      this.client.connect({
        onSuccess: this.onConnect.bind(this),
        onFailure: this.onFailure.bind(this),
        useSSL: false,
        timeout: 3,
        reconnect: true,
      });
    } catch (error) {
      console.error("MQTT connection error:", error);
      this.isConnecting = false;
      this.setStatus("ERROR");
    }
  }

  private onConnect() {
    this.isConnecting = false;
    this.setStatus("CONNECTED");
    this.subscriptions.forEach((_, topic) => {
      this.client.subscribe(topic);
    });
  }

  private onFailure(response: { errorCode: number; errorMessage: string }) {
    this.isConnecting = false;
    this.setStatus("ERROR");
    console.error(`MQTT Connection Failure: ${response.errorMessage}`);
  }

  private onConnectionLost(response: {
    errorCode: number;
    errorMessage: string;
  }) {
    this.isConnecting = false;
    this.setStatus("DISCONNECTED");
    if (response.errorCode !== 0) {
      console.error(`MQTT Connection Lost: ${response.errorMessage}`);
    }
  }

  private onMessageArrived(message: Paho.Message) {
    const topic = message.destinationName;
    const payload = JSON.parse(message.payloadString);
    const callbacks = this.subscriptions.get(topic);
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }
  }

  public subscribe(topic: string, callback: MessageCallback) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }
    this.subscriptions.get(topic)!.push(callback);

    if (this.status === "CONNECTED") {
      this.client.subscribe(topic);
    }
  }

  public unsubscribe(topic: string, callback: MessageCallback) {
    const callbacks = this.subscriptions.get(topic);
    if (callbacks) {
      const filteredCallbacks = callbacks.filter((cb) => cb !== callback);
      if (filteredCallbacks.length > 0) {
        this.subscriptions.set(topic, filteredCallbacks);
      } else {
        this.subscriptions.delete(topic);
        if (this.status === "CONNECTED") {
          this.client.unsubscribe(topic);
        }
      }
    }
  }

  public onStatusChange(callback: StatusChangeCallback) {
    this.statusChangeCallbacks.push(callback);
    callback(this.status);
  }

  public offStatusChange(callback: StatusChangeCallback) {
    this.statusChangeCallbacks = this.statusChangeCallbacks.filter(
      (cb) => cb !== callback,
    );
  }
}
