package com.maltego.syncview;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

/**
 *
 * @author gertgeringer
 */
@Controller
public class SyncController {

    @MessageMapping("/update-state")
    @SendTo("/topic/state")
    public MouseLocation syncLocations(MouseLocation location) {
        return location;
    }

}
