import os
import streamlit as st
from langchain_aws import ChatBedrock
from langchain_community.chat_message_histories import DynamoDBChatMessageHistory
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# define session ID
if "session_id" not in st.session_state:
    st.session_state.session_id = "session_id"

# define chat history
if "history" not in st.session_state:
    table_name = os.environ.get("TABLE_NAME")
    assert table_name is not None, "You must specify DynamoDB table"
    st.session_state.history = DynamoDBChatMessageHistory(
      table_name=table_name,
      session_id=st.session_state.session_id,
      primary_key_name="UserId",
      key={"UserId": "test_user", "SessionId": st.session_state.session_id},
    )

# define LangChain ops
if "chat" not in st.session_state:
    prompt = ChatPromptTemplate.from_messages(
      [
        ("system", "絵文字入りでフレンドリーに会話してください"),
        MessagesPlaceholder(variable_name="messages"),
        MessagesPlaceholder(variable_name="human_message"),
      ]
    )

    chat = ChatBedrock(
        model_id="anthropic.claude-3-haiku-20240307-v1:0",
        model_kwargs={"max_tokens": 4000},
        streaming=True,
    )

    st.session_state.chain = prompt | chat

# set title
st.title("My Bedrock Simple Chat")

# define clear button
if st.button("履歴クリア"):
    st.session_state.history.clear()

# display messages
for message in st.session_state.history.messages:
    with st.chat_message(message.type):
        st.markdown(message.content)

# define chat interface
if prompt := st.chat_input("メッセージを入力してください"):
    # add user message to chat history
    with st.chat_message("user"):
        st.markdown(prompt)

    # add assistant message to chat history
    with st.chat_message("assistant"):
        response = st.write_stream(
            st.session_state.chain.stream(
                {
                    "messages": st.session_state.history.messages,
                    "human_message": [HumanMessage(content=prompt)]
                },
                config={
                    "configurable": {
                        "session_id": st.session_state.session_id
                    }
                }
            )
        )

    # add chat history
    st.session_state.history.add_user_message(prompt)
    st.session_state.history.add_ai_message(response)
