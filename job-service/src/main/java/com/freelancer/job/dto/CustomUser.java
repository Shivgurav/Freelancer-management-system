package com.freelancer.job.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomUser {
	  private String userId;
	    private String email;
	    private String role;
	    private String firstName;
	    private String lastName;

}
