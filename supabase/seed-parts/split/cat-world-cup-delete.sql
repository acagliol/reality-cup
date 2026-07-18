delete from public.ai_answers where round_content_id in (select id from public.round_content where category_id = 'cat-world-cup');
delete from public.crowd_stats where round_content_id in (select id from public.round_content where category_id = 'cat-world-cup');
delete from public.round_content where category_id = 'cat-world-cup';
