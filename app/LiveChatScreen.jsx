import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';



export default function LiveChatScreen() {
  const router = useRouter();
  const { customerId, wsUrl: wsUrlParam } = useLocalSearchParams();

  // Cache one time, and only update if wsUrlParam changes
  const wsUrl = useMemo(
    // () => (wsUrlParam ? String(wsUrlParam) : 'wss://import-zum-york-quarter.trycloudflare.com/ws'),
    () => (wsUrlParam ? String(wsUrlParam) : 'ws://10.0.2.2:8000/ws'), // This is for emulator, normally is localhost
    [wsUrlParam]
  );


  const wsRef = useRef(null); // Stores the WebSoc instance
  const [connected, setConnected] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [queuePos, setQueuePos] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // {id, conversationId, sender_role, content, ts}


  const appendMessage = useCallback((m) => {
    setMessages((prev) => {
      if (m?.id && prev.some((x) => x.id === m.id)) return prev;
      return [...prev, m]; // Spread syntax to create new array and append new message
    });
  }, []); // Never Changes

  const connect = useCallback(() => {
    try {
      const url = wsUrl.includes('?') ? `${wsUrl}&role=customer` : `${wsUrl}?role=customer`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ type: 'hello', conversationId: null })); // Send over the new conversation request
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          switch (data.type) {
            case 'ready':
              if (data.conversationId) setConversationId(data.conversationId);
              break;
            case 'queue.update':
              setQueuePos(typeof data.position === 'number' ? data.position : null);
              break;
            case 'assigned':
              setQueuePos(null);
              break;
            case 'message.new':
              if (data.message) appendMessage(data.message);
              break;
            case 'ended':
              setQueuePos(null);
              setConnected(false);
              break;
            case 'error':
              console.warn('Server error:', data);
              break;
            default:
              break;
          }
        } catch (e) {
          console.warn('Bad JSON from server:', e);
        }
      };

      ws.onerror = (e) => {
        console.warn('WS error', e?.message || e);
      };

      ws.onclose = () => {
        setConnected(false);
      };
    } catch (e) {
      console.warn('WS connect failed', e);
    }
  }, [wsUrl, appendMessage]);


  // On mount, connect
  useEffect(() => {
    connect();
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
    };
  }, [connect]);

  // Send message function
  const sendLine = useCallback(() => {
    const ws = wsRef.current;
    const text = String(input || '').trim();
    if (!ws || ws.readyState !== 1) return;
    if (!text) return;
    if (!conversationId) return;
    ws.send(JSON.stringify({ type: 'message.send', conversationId, content: text }));
    setInput('');
  }, [input, conversationId]);

  const endChat = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) return;
    if (!conversationId) return;
    ws.send(JSON.stringify({ type: 'end', conversationId }));
  }, [conversationId]);

  // FlatList render item function
  const renderItem = ({ item }) => {
    const mine = item.sender_role === 'customer';
    return (
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text style={styles.bubbleText}>{item.content}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Live Support</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>you: {String(customerId)}</Text>
            <Text style={[styles.meta, { marginLeft: 12 }]}>
              conn: {connected ? 'online' : 'offline'}
            </Text>
            {queuePos != null && (
              <Text style={[styles.meta, { marginLeft: 12 }]}>queue: #{queuePos}</Text>
            )}
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item, idx) => item.id || String(idx)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message…"
            placeholderTextColor="#777"
            returnKeyType="send"
            onSubmitEditing={sendLine}
          />
          <TouchableOpacity style={styles.btn} onPress={sendLine}>
            <Text style={styles.btnText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.endBtn]} onPress={endChat}>
            <Text style={styles.btnText}>End</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, backgroundColor: '#111318' },
  title: { color: 'white', fontSize: 18, fontWeight: '600' },
  metaRow: { flexDirection: 'row', marginTop: 4 },
  meta: { color: '#9aa0a6', fontSize: 12 },
  listContent: { padding: 12 },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 6,
  },
  mine: { alignSelf: 'flex-end', backgroundColor: '#1e88e5' },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#2f333a' },
  bubbleText: { color: 'white', fontSize: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#111318',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1d24',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#3949ab',
    borderRadius: 12,
    marginLeft: 6,
  },
  endBtn: { backgroundColor: '#b00020' },
  btnText: { color: 'white', fontWeight: '600' },
});
