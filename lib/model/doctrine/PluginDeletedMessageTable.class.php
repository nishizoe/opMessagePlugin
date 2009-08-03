<?php
/**
 */
class PluginDeletedMessageTable extends Doctrine_Table
{
 /**
  * @param integer $memberId
  */
  public function addDeleteMessageQuery($memberId = null)
  {
    if (is_null($memberId))
    {
      $memberId = sfContext::getInstance()->getUser()->getMemberId();
    }

    $q = $this->createQuery()
      ->from('DeletedMessage')
      ->where('member_id = ?', $memberId)
      ->andwhere('is_deleted = ?', false);

    return $q;
  }

  /**
   * 削除済みメッセージ一覧
   * @param integer $memberId
   * @param integer $page
   * @param integer $size
   * @return DeletedMessage object（の配列）
   */
  public function getDeletedMessagePager($memberId = null, $page = 1, $size = 20)
  {
    $q = $this->addDeleteMessageQuery($memberId);
    $q->orderBy('created_at DESC');

    $pager = new sfDoctrinePager('DeletedMessage', $size);
    $pager->setQuery($q);
    $pager->setPage($page);
    $pager->init();

    return $pager;
  }

  /**
   * message_idから削除済みメッセージを取得する
   * @param $member_id
   * @param $message_id
   * @return DeletedMessage
   */
  public function getDeletedMessageByMessageId($member_id, $message_id)
  {
    $q = $this->createQuery()
      ->from('DeletedMessage')
      ->where('member_id = ?', $member_id)
      ->addwhere('message_id = ?', $message_id);
    $obj = $q->fetchOne();

    if (!$obj) return null;

    return $obj;
  }

  /**
   * message_send_list_idから削除済みメッセージを取得する
   * @param $member_id
   * @param $message_send_list_id
   * @return DeletedMessage
   */
  public function getDeletedMessageByMessageSendListId($member_id, $message_send_list_id)
  {
    $q = $this->createQuery()
      ->from('DeletedMessage')
      ->where('member_id = ?', $member_id)
      ->addwhere('message_send_list_id = ?', $message_send_list_id);
    $obj = $q->fetchOne();

    if (!$obj) return null;

    return $obj;
  }

  /**
   * delete message 
   * @param int $member_id
   * @param int $message_id
   * @param str $object_name
   * @return boolean 
   */
  public function deleteMessage($member_id, $message_id, $object_name)
  {
    if ($object_name == 'MessageSendList')
    {
      $message = Doctrine::getTable('MessageSendList')->getMessageSendListQueryByMessageId($message_id);
      $deleted_message = $this->getDeletedMessageByMessageSendListId($member_id, $message_id);
      if (!$deleted_message)
      {
        $deleted_message = new DeletedMessage();
      }
      $deleted_message->setMessageId($message_id);
      $deleted_message->setMessageSendListId($message_id);
    }
    elseif ($object_name == 'SendMessageData')
    {
      $message = Doctrine::getTable('SendMessageData')->getSendMassageDataQueryById($message_id);
      $deleted_message = $this->getDeletedMessageByMessageId($member_id, $message_id);
      if (!$deleted_message)
      {
        $deleted_message = new DeletedMessage();
      }
      $deleted_message->setMessageId($message_id);
      $message_send_list = Doctrine::getTable('MessageSendList')->getMessageSendListIdByMessageId($message_id);
      $deleted_message->setMessageSendListId($message_send_list->getId());
    }
    elseif ($object_name == 'DeletedMessage')
    {
      $message = DeletedMessagePeer::retrieveByPK($message_id);
      $deleted_message = null;
    }

    if (!$message) return false;

    if ($deleted_message)
    {
      $deleted_message->setMemberId($member_id);
      $deleted_message->save();
    }
    $message->setIsDeleted(1);
    /* @todo 完全削除の場合ファイルも削除すべきかも */
    $message->save();

    return true;
  }

  /**
   * restore message 
   * @param int $message_id
   * @return boolean 
   */
/*
  public function restoreMessage($message_id)
  {
    $deleted_message = DeletedMessagePeer::retrieveByPK($message_id);
    if (!$deleted_message) {
      return false;
    }
    if ($deleted_message->getMessageSendListId() != null) {
        $message = MessageSendListPeer::retrieveByPK($deleted_message->getMessageSendListId());
    } else if ($deleted_message->getMessageId() != null) {
        $message = SendMessageDataPeer::retrieveByPK($deleted_message->getMessageId());
    }
    if (!$message) {
      return false;
    }
    $deleted_message->delete();
    $message->setIsDeleted(0);
    $message->save();
    return true;
  }
*/
}