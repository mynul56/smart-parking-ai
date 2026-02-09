class ChatMessage {
  final String id;
  final String text;
  final MessageSender sender;
  final DateTime timestamp;
  final List<ParkingSuggestion>? suggestions;

  ChatMessage({
    required this.id,
    required this.text,
    required this.sender,
    required this.timestamp,
    this.suggestions,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
      text: json['text'] ?? json['message'] ?? '',
      sender: json['sender'] == 'user' ? MessageSender.user : MessageSender.bot,
      timestamp: json['timestamp'] != null ? DateTime.parse(json['timestamp']) : DateTime.now(),
      suggestions: json['suggestions'] != null
          ? (json['suggestions'] as List).map((s) => ParkingSuggestion.fromJson(s)).toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'sender': sender == MessageSender.user ? 'user' : 'bot',
      'timestamp': timestamp.toIso8601String(),
      'suggestions': suggestions?.map((s) => s.toJson()).toList(),
    };
  }
}

enum MessageSender { user, bot }

class ParkingSuggestion {
  final String id;
  final String name;
  final String address;
  final int availableSlots;
  final int totalSlots;
  final double pricePerHour;
  final int? distance;
  final List<String> features;
  final String reason;

  ParkingSuggestion({
    required this.id,
    required this.name,
    required this.address,
    required this.availableSlots,
    required this.totalSlots,
    required this.pricePerHour,
    this.distance,
    this.features = const [],
    required this.reason,
  });

  factory ParkingSuggestion.fromJson(Map<String, dynamic> json) {
    return ParkingSuggestion(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      availableSlots: json['availableSlots'] ?? 0,
      totalSlots: json['totalSlots'] ?? 0,
      pricePerHour: (json['pricePerHour'] ?? 0).toDouble(),
      distance: json['distance'],
      features: json['features'] != null ? List<String>.from(json['features']) : [],
      reason: json['reason'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'availableSlots': availableSlots,
      'totalSlots': totalSlots,
      'pricePerHour': pricePerHour,
      'distance': distance,
      'features': features,
      'reason': reason,
    };
  }

  String get distanceText {
    if (distance == null) return '';
    if (distance! < 1000) return '${distance}m away';
    return '${(distance! / 1000).toStringAsFixed(1)}km away';
  }
}

class ChatbotResponse {
  final String message;
  final List<ParkingSuggestion> suggestions;
  final String type;
  final TopChoice? topChoice;

  ChatbotResponse({
    required this.message,
    required this.suggestions,
    required this.type,
    this.topChoice,
  });

  factory ChatbotResponse.fromJson(Map<String, dynamic> json) {
    return ChatbotResponse(
      message: json['message'] ?? '',
      suggestions: json['suggestions'] != null
          ? (json['suggestions'] as List).map((s) => ParkingSuggestion.fromJson(s)).toList()
          : [],
      type: json['type'] ?? 'unknown',
      topChoice: json['topChoice'] != null ? TopChoice.fromJson(json['topChoice']) : null,
    );
  }
}

class TopChoice {
  final String id;
  final String name;

  TopChoice({required this.id, required this.name});

  factory TopChoice.fromJson(Map<String, dynamic> json) {
    return TopChoice(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
    );
  }
}
