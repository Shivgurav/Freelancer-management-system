package com.freelancer.contract.client;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import com.freelancer.contract.client.AuthClient.UserInfo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JobClient {
	private final WebClient.Builder webClientBuilder;
	
	@Value("${services.job}")
	private String jobServiceUrl;
   
	public JobClient (WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }
	 public JobInfo getJobInfo(UUID jobId) {
	        try {
	            return webClientBuilder.build()
	                    .get()
	                    .uri(jobServiceUrl +
	                         "/api/jobs/" + jobId)
	                    .retrieve()
	                    .bodyToMono(JobInfo.class)
	                    .block();

	        } catch (Exception e) {
	            log.error("Could not fetch user info for userId: {} — {}",
	                    jobId, e.getMessage());
	            // Return empty info — don't fail main operation
	            return new JobInfo(
	            	    "no title",
	            	    "no description",
	            	    BigDecimal.ZERO,
	            	    BigDecimal.ZERO,
	            	    null,
	            	    0
	            	);
	        }
	    }
	 

@Data
@AllArgsConstructor
@NoArgsConstructor
public static class JobInfo{
	 private String        title;
	    private String        description;
	    private BigDecimal    budgetMin;
	    private BigDecimal    budgetMax;
	    private LocalDate     deadline;
	    private Integer       durationDays;
	
}
}
