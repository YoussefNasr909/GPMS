import { apiRequest } from "./http"
import type {
  ApiChatBootstrap,
  ApiChatClearResult,
  ApiChatConversationMessages,
  ApiChatDeleteMessageResult,
  ApiChatEditMessageResult,
  ApiChatSearchResult,
  ApiChatSeenResult,
  ApiChatSendResult,
} from "./types"

export const chatApi = {
  bootstrap: () => apiRequest<ApiChatBootstrap>("/chat/bootstrap"),
  unreadCount: () => apiRequest<{ unreadCount: number }>("/chat/unread-count"),
  searchUsers: (query: string) => apiRequest<ApiChatSearchResult[]>(`/chat/users/search?q=${encodeURIComponent(query)}`),
  messages: (conversationId: string) =>
    apiRequest<ApiChatConversationMessages>(`/chat/conversations/${conversationId}/messages`),
  send: (payload: { recipientId: string; content?: string }, file?: File) => {
    if (file) {
      const formData = new FormData();
      formData.append("recipientId", payload.recipientId);
      if (payload.content) {
        formData.append("content", payload.content);
      }
      formData.append("file", file);
      
      return apiRequest<ApiChatSendResult>("/chat/messages", {
        method: "POST",
        body: formData,
      });
    }

    return apiRequest<ApiChatSendResult>("/chat/messages", {
      method: "POST",
      body: payload,
    });
  },
  markSeen: (conversationId: string) =>
    apiRequest<ApiChatSeenResult>(`/chat/conversations/${conversationId}/seen`, {
      method: "PATCH",
    }),
  deleteMessage: (messageId: string) =>
    apiRequest<ApiChatDeleteMessageResult>(`/chat/messages/${messageId}`, {
      method: "DELETE",
    }),
  editMessage: (messageId: string, payload: { content: string }) =>
    apiRequest<ApiChatEditMessageResult>(`/chat/messages/${messageId}`, {
      method: "PATCH",
      body: payload,
    }),
  clearConversation: (conversationId: string) =>
    apiRequest<ApiChatClearResult>(`/chat/conversations/${conversationId}/clear`, {
      method: "DELETE",
    }),
}
