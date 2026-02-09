import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/api/api_client.dart';
import '../../../core/models/chatbot_models.dart';

// Events
abstract class ChatbotEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class SendMessage extends ChatbotEvent {
  final String message;
  final Map<String, double>? userLocation;

  SendMessage(this.message, {this.userLocation});

  @override
  List<Object?> get props => [message, userLocation];
}

class LoadChatHistory extends ChatbotEvent {}

class ClearChat extends ChatbotEvent {}

// States
abstract class ChatbotState extends Equatable {
  @override
  List<Object?> get props => [];
}

class ChatbotInitial extends ChatbotState {}

class ChatbotLoading extends ChatbotState {
  final List<ChatMessage> messages;

  ChatbotLoading(this.messages);

  @override
  List<Object?> get props => [messages];
}

class ChatbotLoaded extends ChatbotState {
  final List<ChatMessage> messages;

  ChatbotLoaded(this.messages);

  @override
  List<Object?> get props => [messages];
}

class ChatbotError extends ChatbotState {
  final String message;
  final List<ChatMessage> messages;

  ChatbotError(this.message, this.messages);

  @override
  List<Object?> get props => [message, messages];
}

// Bloc
class ChatbotBloc extends Bloc<ChatbotEvent, ChatbotState> {
  final ApiClient apiClient;
  final List<ChatMessage> _messages = [];

  ChatbotBloc(this.apiClient) : super(ChatbotInitial()) {
    on<SendMessage>(_onSendMessage);
    on<LoadChatHistory>(_onLoadChatHistory);
    on<ClearChat>(_onClearChat);

    // Add initial greeting
    _messages.add(ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: "Hello! I'm your AI parking assistant. How can I help you find parking today?",
      sender: MessageSender.bot,
      timestamp: DateTime.now(),
    ));
  }

  Future<void> _onSendMessage(SendMessage event, Emitter<ChatbotState> emit) async {
    // Add user message
    final userMessage = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: event.message,
      sender: MessageSender.user,
      timestamp: DateTime.now(),
    );
    _messages.add(userMessage);

    emit(ChatbotLoading(_messages));

    try {
      final response = await apiClient.post('/chatbot/message', {
        'message': event.message,
        if (event.userLocation != null) 'userLocation': event.userLocation,
      });

      if (response['success']) {
        final data = response['data'];
        final botResponse = ChatbotResponse.fromJson(data);

        final botMessage = ChatMessage(
          id: (DateTime.now().millisecondsSinceEpoch + 1).toString(),
          text: botResponse.message,
          sender: MessageSender.bot,
          timestamp: DateTime.now(),
          suggestions: botResponse.suggestions,
        );

        _messages.add(botMessage);
        emit(ChatbotLoaded(_messages));
      } else {
        throw Exception(response['message'] ?? 'Failed to get response');
      }
    } catch (e) {
      final errorMessage = ChatMessage(
        id: (DateTime.now().millisecondsSinceEpoch + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: MessageSender.bot,
        timestamp: DateTime.now(),
      );
      _messages.add(errorMessage);
      emit(ChatbotError(e.toString(), _messages));
    }
  }

  Future<void> _onLoadChatHistory(LoadChatHistory event, Emitter<ChatbotState> emit) async {
    try {
      final response = await apiClient.get('/chatbot/history?limit=20');

      if (response['success']) {
        // Load history if needed
        emit(ChatbotLoaded(_messages));
      }
    } catch (e) {
      emit(ChatbotError(e.toString(), _messages));
    }
  }

  void _onClearChat(ClearChat event, Emitter<ChatbotState> emit) {
    _messages.clear();
    _messages.add(ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: "Hello! I'm your AI parking assistant. How can I help you find parking today?",
      sender: MessageSender.bot,
      timestamp: DateTime.now(),
    ));
    emit(ChatbotLoaded(_messages));
  }
}
