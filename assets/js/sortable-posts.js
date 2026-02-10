(function ($) {
	'use strict';

	var $table = $('table.wp-list-table');
	var $tbody = $table.find('tbody#the-list');

	if (!$tbody.length) {
		return;
	}

	$table.addClass('sortable-posts-enabled');

	function updateLabels() {
		var offset = (parseInt(sortablePostsData.paged, 10) - 1) *
			parseInt(sortablePostsData.perPage, 10);
		$tbody.find('tr').each(function (index) {
			$(this).find('.sortable-posts-order').text(offset + index + 1);
		});
	}

	updateLabels();

	$tbody.sortable({
		items: 'tr:not(.inline-edit-row)',
		handle: '.column-menu_order',
		axis: 'y',
		cursor: 'grabbing',
		placeholder: 'sortable-posts-placeholder',
		opacity: 0.8,
		tolerance: 'pointer',

		start: function (event, ui) {
			ui.placeholder.height(ui.item.height());
			ui.item.find('td, th').each(function () {
				$(this).width($(this).width());
			});
			ui.item.addClass('sortable-posts-dragging');
		},

		stop: function (event, ui) {
			ui.item.removeClass('sortable-posts-dragging');
		},

		update: function () {
			var order = [];
			$tbody.find('tr').each(function () {
				var id = $(this).attr('id');
				if (id) {
					var postId = parseInt(id.replace('post-', ''), 10);
					if (postId) {
						order.push(postId);
					}
				}
			});

			if (!order.length) {
				return;
			}

			$table.css('opacity', '0.6');

			$.post(sortablePostsData.ajaxurl, {
				action: 'sortable_posts_update_order',
				nonce: sortablePostsData.nonce,
				order: order,
				paged: sortablePostsData.paged,
				perPage: sortablePostsData.perPage
			}, function (response) {
				$table.css('opacity', '1');

				if (response.success) {
					updateLabels();
				}
			}).fail(function () {
				$table.css('opacity', '1');
				$tbody.sortable('cancel');
			});
		}
	});

})(jQuery);
