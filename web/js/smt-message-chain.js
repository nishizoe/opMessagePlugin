'use strict';
$(document).ready(function() {

  var message = {

    /**
     * message template.
     */
    $template: $('#message-template'),

    /**
     * config.
     */
    config: {

      /**
       * heartbeat timer.
       */
      timer: null,

      /**
       * interval (second).
       */
      interval: 5,

      /**
       * heartbeat function.
       */
      heartbeatTarget: null
    },

    /**
     * initialize.
     */
    initialize: function() {

      // common.
      $('.message-created-at').timeago();

      // message date line. - show or hide.
      this.updateTimeInfo();

      this.config.heartbeatTarget = this.addNewMessages.bind(false);

      this.addNewMessages(true).always(function() {
        // set timer.
        message.startHeartbeatTimer();
      });

      $('#do-submit').click(function() {
        message.clickDoSubmitButton();
      });

      $('#more').click(function() {
        message.clickMoreButton();
      });

      $('#message_image').change(function() {
        message.imageChangeValidator.call(this);
      });

      var $messageMember = $('#page_message_smtChain #message-member');
      $(window).on('load scroll', function() {
        var $content = $messageMember.find('.content');
        $(this).scrollTop() > $messageMember.offset().top ? $content.addClass('fix') : $content.removeClass('fix');
      });
      $messageMember.height($messageMember.find('.content').outerHeight(true));
    },

    /**
     * hide and show submit fields.
     */
    submitDeactivate: function() {
      $('#message_image').attr('disabled', 'disabled');
      $('#submit-message').attr('disabled', 'disabled');
      $('#do-submit').attr('disabled', 'disabled');
    },

    submitActivate: function() {
      $('#message_image').removeAttr('disabled');
      $('#submit-message').removeAttr('disabled');
      $('#do-submit').removeAttr('disabled');
    },

    /**
     * hide and show more info fields.
     */
    moreFilter: function() {
      $('#loading-more').toggle();
      $('#more').toggle();
    },

    /**
     * hide more info fields.
     */
    hideMore: function() {
      $('#loading-more').hide();
      $('#more').hide();
    },

    /**
     * show more button.
     */
    showMore: function() {
      $('#loading-more').hide();
      $('#more').show();
    },

    /**
     * click #do-submit id button.
     */
    clickDoSubmitButton: function() {

      var body = $('#submit-message').val();
      if (1 > jQuery.trim(body)) {
        return;
      }

      var
        form = $('form#send-message-form'),
        formData = this.getFormData(form);

      this.submitDeactivate();
      this.stopHeartbeatTimer();
      var url = $('#postUrl').val();

      $.ajax({
        url: url,
        type: 'POST',
        processData: false,
        contentType: false,
        data: formData,
        dataType: 'json',
      }).always(function() {

        message.addNewMessages(true).always(function() {
          message.updateTimeInfo();
          $('#no-message').hide();
          $('#submit-message').val('');
          $('#message_image').val('');
          message.submitActivate();
          message.startHeartbeatTimer();
        });
      });
    },

    /**
     * click #more id button.
     */
    clickMoreButton: function() {

      var
        firstMessageWrapper = $('.message-wrapper:first'),
        maxId = Number(firstMessageWrapper.attr('data-message-id'));

      if (isNaN(maxId)) {
        return false;
      }

      this.moreFilter();

      this.getMessages(maxId, false).done(function(response) {

        message.insertMessages(response.data, false);

        message.moreFilter();

        if (!response.has_more) {
          message.hideMore();
        }

      }).fail(function() {
        // TODO error design.
      });
    },

    /**
     * check image file name if change image data.
     */
    imageChangeValidator: function() {

      var a = $(this).prop('files');
      if (0 < a.length) {
        var fileType = a[0].type;
        if (null === fileType.match(/(jpeg|gif|png)/)) {
          alert('ファイル形式が間違っています。');
          $(this).val('');
        }
      }
    },

    /**
     * get FromData Object. openpne apyKey and form value.
     */
    getFormData: function(form) {
      var
        formData = new FormData(form[0]);

      var photo = $('#message_image').val();
      if (photo == null || photo == '') {
        if (typeof formData.delete != "undefined"){
          formData.delete('message_image');
        }
      }

      formData.append('apiKey', openpne.apiKey);
      formData.append('toMember', this.getMemberId());

      $(form.serializeArray()).each(function(i, v) {
        formData.append(v.name, v.value);
      });

      return formData;
    },

    /**
     * partner member id.
     */
    getMemberId: function() {
      var toMemberObj = $('#messageToMember');
      if (toMemberObj) {
        return toMemberObj.val();
      }

      return null;
    },

    /**
     * insert Message template by datas.
     * @param datas
     * @param isAddLow
     */
    insertMessages: function(datas, isAddLow) {

      if (!datas.length) {
        return false;
      }

      for (var i = 0; i < datas.length; i++) {
        this.insertMessageTemplate(datas[i], isAddLow);
      }

      this.updateTimeInfo();

      return true;
    },

    /**
     * insert Message template by data.
     * @param data
     * @param isAddRow
     */
    insertMessageTemplate: function(data, isAddRow) {
      var
        template = this.$template.children().clone(),
        $photo = template.find('.photo'),
        position = data.member.id == this.getMemberId() ? 'right' : 'left';
      var isReadMessage = '';
      if (data.is_read !== null) {
        isReadMessage = data.is_read ? '<span class="label label-success">既読</span>' : '<span class="label label-warning">未読</span>';
      }

      template
        .attr('data-message-id', data.id)
        .addClass(position)
        .addClass('show')
          .find('.time-info')
          .append(data.formatted_date)
            .parent('.time-info-wrapper')
            .attr('data-created-at-date', data.formatted_date)
          .end()
        .end()
          .find('.message-status')
          .html(isReadMessage)
        .end()
          .find('.popover-title')
          .append(data.member.name)
        .end()
          .find('.message-body')
          .append(data.body)
        .end()
          .find('.message-created-at')
          .addClass(position)
          .attr('title', data.created_at)
          .timeago()
        .end();

      // has one image data from api. this opMessagePlugin version.
      if (data.images) {
        console.log(data.images);
        $.each(data.images, function(key, image) {
          $photo.append('<li><a href="' + image.path + '">' + image.tag + '</a></li>');
        });
      } else {
        $photo.remove();
      }

      if (isAddRow) {
        $('#message-wrapper-parent').append(template);
      } else {
        $('#message-wrapper-parent').prepend(template);
      }

      $('.message-body').readmore({
        speed: 75,
        moreLink: '<a href="javascript:void(0);">[もっと見る]</a>',
        lessLink: '<a href="javascript:void(0);">[閉じる]</a>'
      });
    },

    /**
     * hide pagenation.
     */
    hidePager: function() {
      $('#messagePrevLink').hide();
      $('#messageNextLink').hide();
      $('.pager').hide();

      $('#nextPage').val('');
      $('#prevPage').val('');
      $('#page').val('');
    },

    /**
     * update Time info line.
     */
    updateTimeInfo: function() {
      var
        timeInfoWrapper = $('#message-wrapper-parent').find('.time-info-wrapper'),
        currentDate,
        baseDate;

      for (var i = 0; i < timeInfoWrapper.length; i++) {
        currentDate = timeInfoWrapper.eq(i).attr('data-created-at-date');
        if (currentDate) {
          if (currentDate === baseDate) {
            timeInfoWrapper.eq(i).hide();
          } else {
            timeInfoWrapper.eq(i).show();
          }

          baseDate = currentDate;
        }
      }
    },

    /**
     * start heartbeat timer.
     */
    startHeartbeatTimer: function() {
      this.config.timer = setTimeout(this.config.heartbeatTarget, this.config.interval * 1000);
    },

    /**
     * stop heartbeat timer.
     */
    stopHeartbeatTimer: function() {
      clearTimeout(this.config.timer);
    },

    /**
     * insert Message template by data.
     * @param keyId
     * @param isAddLow
     */
    getMessages: function(keyId, isAddLow) {

      var dfd = $.Deferred();
      var url = $('#chainUrl').val();

      $.ajax({
        url: url,
        type: 'POST',
        data: {
          apiKey: openpne.apiKey,
          memberId: Number(this.getMemberId()),
          maxId: Number(keyId),
          isAddLow: Number(isAddLow)
        },
        dataType: 'json',
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(e) {
          dfd.reject();
        }
      });

      return dfd.promise();
    },

    /**
     * update readed message data.
     * @param keyId
     * @param isAddLow
     */
    getReadedList: function() {

      var dfd = $.Deferred();
      var url = $('#messageRecentList').val();
      $.ajax({
        url: url,
        type: 'POST',
        data: {
          apiKey: openpne.apiKey,
          memberId: Number(this.getMemberId()),
          maxUpdatedAt: $('#readedMaxUpdatedAt').val()
        },
        dataType: 'json',
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(e) {
          dfd.reject();
        }
      });

      return dfd.promise();
    },

    /**
     * add new messages.
     */
    addNewMessages: function(notUseHeartbeat) {

      var
        lastMessageWrapper = $('#message-wrapper-parent').find('.message-wrapper:last'),
        minId = Number(lastMessageWrapper.attr('data-message-id')),
        dfd = $.Deferred();

      if (isNaN(minId)) {
        minId = -1;
      }

      message.getMessages(minId, true).done(function(response) {

        $('#first-loading').hide();
        var result = message.insertMessages(response.data, true);
        var isFirst = true;
        if (isFirst && null !== response.readed_max_updated_at)
        {
          $('#readedMaxUpdatedAt').val(response.readed_max_updated_at);
          isFirst= false;
        }

        dfd.resolve();

        if (!$('#message-wrapper-parent').find('.message-wrapper').length) {
          message.hideMore();
          $('#no-message').show();

          return false;
        }

        $('#no-message').hide();

        if (result) {
          $(window).scrollTop($('#message-wrapper-parent').find('.message-wrapper:last').offset().top);
        }

        if (minId == -1 && response.has_more) {
          message.showMore();
        }

        message.getReadedList().done(function(response) {
          for (var i = 0; i < response.ids.length; i++) {
            var selector = 'div.message-wrapper[data-message-id="'+ response.ids[i] +'"] p.message-status';
            $(selector).html('<span class="label label-success">既読</span>');
            $('#readedMaxUpdatedAt').val(response.max_updated_at);
          }
        });

      }).always(function() {

        if (!notUseHeartbeat) {
          message.startHeartbeatTimer();
        }

      }).fail(function() {
        dfd.reject();
        // TODO error design.
      });

      return dfd.promise();
    }
  };

  message.initialize();
});
