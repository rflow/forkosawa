<?php get_header(); ?>

<div class="content">

	<?php if ( is_category() ) : ?>
		<div class="home-page-content">
		  <div class="rflow-mugshot"></div>
		  <div class="rflow-vital-statistics">
		    <h1 class="rflow-title">Alastair Dant</h1>
		    <p class="rflow-role">Senior Product Engineer</p>
		    <p class="rflow-asl">
		      <span>SF Bay Area, CA</span><span> | </span><span>Computer Software</span>
		    </p>
		    <table class="rflow-info-table">
		      <tr>
		        <td class="rflow-info-field">Current</td>
		        <td class="rflow-info-value">Lead UI Engineer, Riffyn, Inc</td>
		      </tr>
		      <tr>
		        <td class="rflow-info-field">Previously</td>
		        <td class="rflow-info-value">New York Times, Guardian News, Mind Candy</td>
		      </tr>
		      <tr>
		        <td class="rflow-info-field">Education</td>
		        <td class="rflow-info-value">University College London</td>
		      </tr>
		    </table>
		  </div>
		</div>
	<?php endif; ?>

	<div class="page-title">
			
		<div class="section-inner">

			<h4><?php if ( is_day() ) : ?>
				<?php echo get_the_date( get_option('date_format') ); ?>
			<?php elseif ( is_month() ) : ?>
				<?php echo get_the_date('F Y'); ?>
			<?php elseif ( is_year() ) : ?>
				<?php echo get_the_date('Y'); ?>
			<?php elseif ( is_category() ) : ?>
				<?php printf( __( '%s', 'fukasawa' ), '' . single_cat_title( '', false ) . '' ); ?>
			<?php elseif ( is_tag() ) : ?>
				<?php printf( __( 'Tag: %s', 'fukasawa' ), '' . single_tag_title( '', false ) . '' ); ?>
			<?php elseif ( is_author() ) : ?>
				<?php $curauth = (isset($_GET['author_name'])) ? get_user_by('slug', $author_name) : get_userdata(intval($author)); ?>
				<?php printf( __( 'Author: %s', 'fukasawa' ), $curauth->display_name ); ?>
			<?php else : ?>
				<?php _e( 'Archive', 'fukasawa' ); ?>
			<?php endif; ?>
			
			<?php
			$paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
			
			if ( "1" < $wp_query->max_num_pages ) : ?>
			
				<span><?php printf( __('Page %s of %s', 'fukasawa'), $paged, $wp_query->max_num_pages ); ?></span>
				
				<div class="clear"></div>
			
			<?php endif; ?></h4>
					
		</div> <!-- /section-inner -->
		
	</div> <!-- /page-title -->
	
	<?php if ( have_posts() ) : ?>
	
		<?php rewind_posts(); ?>
			
		<div class="posts" id="posts">
			
			<?php while ( have_posts() ) : the_post(); ?>
						
				<?php get_template_part( 'content', get_post_format() ); ?>
				
			<?php endwhile; ?>
							
		</div> <!-- /posts -->
		
		<?php if ( $wp_query->max_num_pages > 1 ) : ?>
			
			<div class="archive-nav">
			
				<div class="section-inner">
			
					<?php echo get_next_posts_link( '&laquo; ' . __('Older posts', 'fukasawa')); ?>
							
					<?php echo get_previous_posts_link( __('Newer posts', 'fukasawa') . ' &raquo;'); ?>
					
					<div class="clear"></div>
				
				</div>
				
			</div> <!-- /post-nav archive-nav -->
							
		<?php endif; ?>
				
	<?php endif; ?>

</div> <!-- /content -->

<?php get_footer(); ?>